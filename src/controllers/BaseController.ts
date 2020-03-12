import { AnySchema } from '@hapi/joi';
import { Maybe, Session } from 'ch-node-session-handler';
import { Request } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { unmanaged } from 'inversify';
import { httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { CHECK_YOUR_APPEAL_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export type FormSanitizeFunction<T> = (body: T) => T
type FormSubmissionProcessorConstructor = new (...args:any[]) => FormSubmissionProcessor

const createChangeModeAwareNavigationProxy = (step: Navigation): Navigation => {
    return new Proxy(step, {
        get (target: Navigation, propertyName: 'previous' | 'next'): any {
            return (req: Request) => {
                if (req.query.cm === '1') {
                    return CHECK_YOUR_APPEAL_PAGE_URI;
                }
                return (target[propertyName] as (req: Request) => string).apply(this, [req])
            }
        }
    })
};

export abstract class BaseController<FORM> extends BaseAsyncHttpController {
    protected constructor(@unmanaged() readonly template: string,
                          @unmanaged() readonly navigation: Navigation,
                          @unmanaged() readonly formSchema?: AnySchema,
                          @unmanaged() readonly formSanitizeFunction?: FormSanitizeFunction<FORM>,
                          @unmanaged() readonly formSubmissionProcessors?: FormSubmissionProcessorConstructor[]) {
        super();
        this.navigation = createChangeModeAwareNavigationProxy(navigation);
    }

    @httpGet('')
    public async onGet(): Promise<void> {
        // check page passes in session and:
        // 1. pass through if user holds pass for URI extracted from `this.httpContext.request`
        // 2. redirect to page representing last received pass
        return await this.render(
            this.template,
            {
                ...this.prepareViewModelFromSession(this.httpContext.request.session.unsafeCoerce()),
                ...this.prepareNavigationConfig()
            }
        );
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {
        const appeal: Appeal = session
            .getExtraData()
            .chain<Appeal>(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .orDefault({} as Appeal);

        return this.prepareViewModelFromAppeal(appeal)
    }

    @httpPost('')
    public async onPost(): Promise<void> {
        if (this.formSchema != null) {
            const validationResult: ValidationResult = new SchemaValidator(this.formSchema)
                .validate(this.httpContext.request.body);
            if (validationResult.errors.length > 0) {
                return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                    this.template,
                    {
                        ...this.httpContext.request.body,
                        validationResult,
                        ...this.prepareNavigationConfig()
                    }
                );
            }
        }

        if (this.formSanitizeFunction != null) {
            this.httpContext.request.body = this.formSanitizeFunction(this.httpContext.request.body)
        }

        // Create page pass out of `this.navigation.next(this.httpContext.request)` and store it in session

        if (this.formSubmissionProcessors != null) {
            for (const processorType of this.formSubmissionProcessors) {
                const processor= this.httpContext.container.get(processorType);
                await processor.process(this.httpContext.request);
            }
        }

        return this.httpContext.response.redirect(this.navigation.next(this.httpContext.request));
    }

    private prepareNavigationConfig(): any {
        return {
            navigation: {
                back: {
                    href: this.navigation.previous(this.httpContext.request)
                }
            }
        }
    }

    protected abstract prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & FORM;
}
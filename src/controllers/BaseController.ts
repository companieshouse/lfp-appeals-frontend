import { Maybe, Session } from 'ch-node-session-handler';
import { Request } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { unmanaged } from 'inversify';
import { httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormSubmissionProcessorConstructor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CHECK_YOUR_APPEAL_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export type FormSanitizeFunction<T> = (body: T) => T;

const createChangeModeAwareNavigationProxy = (step: Navigation): Navigation => {
    return new Proxy(step, {
        get(target: Navigation, propertyName: 'previous' | 'next'): any {
            return (req: Request) => {
                if (req.query.cm === '1') {
                    return CHECK_YOUR_APPEAL_PAGE_URI;
                }
                return (target[propertyName] as (req: Request) => string).apply(this, [req]);
            };
        }
    });
};

// tslint:disable-next-line:max-classes-per-file
export abstract class BaseController<FORM> extends BaseAsyncHttpController {
    protected constructor(@unmanaged() readonly template: string,
                          @unmanaged() readonly navigation: Navigation,
                          @unmanaged() readonly validator?: Validator,
                          @unmanaged() readonly formSanitizeFunction?: FormSanitizeFunction<FORM>,
                          @unmanaged() readonly formSubmissionProcessors?: FormSubmissionProcessorConstructor[]) {
        super();
        this.navigation = createChangeModeAwareNavigationProxy(navigation);
    }

    @httpGet('')
    public async onGet(): Promise<void> {
        return await this.render(
            this.template,
            {
                ...this.prepareViewModelFromSession(this.httpContext.request.session.unsafeCoerce()),
                ...this.prepareNavigationConfig()
            }
        );
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {
        const applicationData: ApplicationData = session
            .getExtraData()
            .chain<ApplicationData>(data => Maybe.fromNullable(data[APPLICATION_DATA_KEY]))
            .orDefault({} as ApplicationData);

        return this.prepareViewModelFromAppeal(applicationData.appeal || {});
    }

    @httpPost('')
    public async onPost(): Promise<void> {
        if (this.validator != null) {
            const validationResult: ValidationResult = this.validator.validate(this.httpContext.request);
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
            this.httpContext.request.body = this.formSanitizeFunction(this.httpContext.request.body);
            loggerInstance()
                .debug(`
                ${BaseController.name} - Sanitized form body: ${JSON.stringify(this.httpContext.request.body)}
                `);
        }

        if (this.formSubmissionProcessors != null) {
            for (const processorType of this.formSubmissionProcessors) {
                const processor = this.httpContext.container.get(processorType);
                await processor.process(this.httpContext.request, this.httpContext.response);
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
        };
    }

    protected abstract prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & FORM;
}

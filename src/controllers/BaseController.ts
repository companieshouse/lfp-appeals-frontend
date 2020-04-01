import { Maybe, Session } from 'ch-node-session-handler';
import { Request, Response } from 'express';
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

export interface ActionHandler {
    handle(request: Request, response: Response): void | Promise<void>
}

export type ActionHandlerConstructor = new (...args: any[]) => ActionHandler

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
        const action: string = this.httpContext.request.query?.action;

        if (action != null) {
            let actionHandler = this.getExtraActionHandlers()[action];
            if (actionHandler == null) {
                throw new Error(`Action handler for action ${action} must be registered`)
            }
            if (typeof actionHandler === 'function') {
                actionHandler = this.httpContext.container.get(actionHandler) as ActionHandler;
            }
            return actionHandler.handle(this.httpContext.request, this.httpContext.response);
        } else {
            return this.getDefaultActionHandler().handle(this.httpContext.request, this.httpContext.response);
        }
    }

    protected getExtraActionHandlers(): Record<string, ActionHandler | ActionHandlerConstructor> {
        return {}
    }

    private getDefaultActionHandler(): ActionHandler {
        const that = this;
        return {
           async handle(request: Request, response: Response): Promise<void> {
                if (that.validator != null) {
                    const validationResult: ValidationResult = that.validator.validate(request);
                    if (validationResult.errors.length > 0) {
                        return await that.renderWithStatus(UNPROCESSABLE_ENTITY)(
                            that.template,
                            {
                                ...request.body,
                                validationResult,
                                ...that.prepareNavigationConfig()
                            }
                        );
                    }
                }

                if (that.formSanitizeFunction != null) {
                    request.body = that.formSanitizeFunction(request.body);
                    loggerInstance().debug(`${BaseController.name} - sanitized form body: ${JSON.stringify(request.body)}`);
                }

                if (that.formSubmissionProcessors != null) {
                    for (const processorType of that.formSubmissionProcessors) {
                        const processor = that.httpContext.container.get(processorType);
                        await processor.process(request, response);
                    }
                }

                return response.redirect(that.navigation.next(request));
            }
        }
    }

    private prepareNavigationConfig(): any {
        return {
            navigation: {
                back: {
                    href: this.navigation.previous(this.httpContext.request)
                },
                forward: {
                    href: this.navigation.next(this.httpContext.request)
                }
            }
        };
    }

    protected abstract prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & FORM;
}

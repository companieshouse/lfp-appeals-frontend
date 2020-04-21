import { Maybe, Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { unmanaged } from 'inversify';
import { httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormActionProcessorConstructor } from 'app/controllers/processors/FormActionProcessor';
import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';
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

const sessionCookieName = getEnvOrThrow('COOKIE_NAME');
const sessionCookieDomain = getEnvOrThrow('COOKIE_DOMAIN');
const sessionCookieSecureFlag = getEnvOrDefault('COOKIE_SECURE_ONLY', 'true');
const sessionCookieSecret = getEnvOrThrow('COOKIE_SECRET');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10);

export interface FormActionHandler {
    handle(request: Request, response: Response): void | Promise<void>;
}

export type FormActionHandlerConstructor = new (...args: any[]) => FormActionHandler;

export class BaseController<FORM> extends BaseAsyncHttpController {
    protected constructor(@unmanaged() readonly template: string,
                          @unmanaged() readonly navigation: Navigation,
                          @unmanaged() readonly validator?: Validator,
                          @unmanaged() readonly formSanitizeFunction?: FormSanitizeFunction<FORM>,
                          @unmanaged() readonly formActionProcessors?: FormActionProcessorConstructor[]) {
        super();
        this.navigation = createChangeModeAwareNavigationProxy(navigation);
    }

    /**
     * GET handler that renders template with session data if present.
     * <p>
     * Controllers that extend this class can shape view model by overriding either {@link prepareViewModelFromAppeal}
     * if view model can be rendered purely of appeal data or {@link prepareViewModelFromSession} if access to
     * whole session is necessary.
     */
    @httpGet('')
    public async onGet(): Promise<void> {
        return await this.render(
            this.template,
            {
                ...this.prepareViewModel(),
                ...this.prepareNavigationConfig()
            }
        );
    }

    /**
     * Builds view model based of request by delegating to {@link prepareViewModelFromSession}.
     * <p>
     * Designed to be overridden.
     */
    protected prepareViewModel(): Record<string, any> & FORM {
        return this.httpContext.request.session
            .map(session => this.prepareViewModelFromSession(session))
            .orDefault({} as Record<string, any> & FORM);
    }

    /**
     * Builds view model based of session data by delegating to {@link prepareViewModelFromAppeal}.
     * <p>
     * Designed to be overridden.
     *
     * @param session
     */
    protected prepareViewModelFromSession(session: Session): Record<string, any> & FORM {
        const applicationData: ApplicationData = session
            .getExtraData()
            .chain<ApplicationData>(data => Maybe.fromNullable(data[APPLICATION_DATA_KEY]))
            .orDefault({} as ApplicationData);

        return this.prepareViewModelFromAppeal(applicationData.appeal || {});
    }

    /**
     * Builds view model based of appeal data. By default it returns empty object.
     * <p>
     * Designed to be overridden.
     *
     * @param appeal
     */
    // @ts-ignore
    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & FORM {
        return {} as FORM;
    }

    /**
     * POST handler that by delegates handling to {@link getDefaultActionHandler} if no action query argument is present
     * or to one of extra handlers defined in {@link getExtraActionHandlers} map if action query is present. If there is
     * no matching action handler for action query argument then an error will be thrown.
     */
    @httpPost('')
    public async onPost(): Promise<void> {
        const action: string | undefined = this.httpContext.request.query.action as string | undefined;

        if (action != null) {
            let actionHandler = this.getExtraActionHandlers()[action];
            if (actionHandler == null) {
                throw new Error(`Action handler for action ${action} must be registered`);
            }
            if (typeof actionHandler === 'function') {
                actionHandler = this.httpContext.container.get(actionHandler) as FormActionHandler;
            }
            return actionHandler.handle(this.httpContext.request, this.httpContext.response);
        } else {
            return this.getDefaultActionHandler().handle(this.httpContext.request, this.httpContext.response);
        }
    }

    /**
     * Returns map of additional action handlers which is empty by default.
     * <p>
     * Designed to be overridden.
     */
    protected getExtraActionHandlers(): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        return {};
    }

    /**
     * Returns default action handler that:
     *  - validates form data and renders errors when needed (if validator is provided),
     *  - sanitizes form data (if sanitize function is provided),
     *  - performs additional processing (if one or more processor is provided),
     *  - persists session in database,
     *  - redirects to next navigation point.
     *  <p>
     *  Controllers that extend this class can shape session model by overriding {@link prepareSessionModelPriorSave }.
     */
    private getDefaultActionHandler(): FormActionHandler {
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

                if (that.formActionProcessors != null) {
                    for (const actionProcessorType of that.formActionProcessors) {
                        const actionProcessor = that.httpContext.container.get(actionProcessorType);
                        await actionProcessor.process(request, response);
                    }
                }

                const session = request.session.extract();
                if (session != null) {
                    const applicationData: ApplicationData = session.getExtraData()
                        .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
                        .orDefaultLazy(() => {
                            const value = {} as ApplicationData;
                            session.saveExtraData(APPLICATION_DATA_KEY, value);
                            return value;
                        });

                    // tslint:disable-next-line: max-line-length
                    applicationData.appeal = that.prepareSessionModelPriorSave(applicationData.appeal || {}, request.body);

                    await that.persistSession();
                }

                return response.redirect(that.navigation.next(request));
            }
        };
    }

    /**
     * Builds session model based on both existing appeal data and form data. By default it makes no change.
     * <p>
     * Designed to be overridden.
     */
    // @ts-ignore
    protected prepareSessionModelPriorSave(appeal: Appeal, value: FORM): Appeal {
        return appeal;
    }

    /**
     * Persists session state in database and serves refreshed session cookie to the browser. It it part of an internal
     * API nto intended for override. It remains exposed to controllers that extends this class in case on of the
     * extra action handlers needs to persist session after modification.
     * <p>
     * Cause it is internal API it assumes existence of session and throws an error when called while session was empty.
     *
     * Warning: it should not be overridden.
     */
    protected async persistSession(): Promise<void> {
        const session = this.httpContext.request.session.unsafeCoerce();

        const result = await this.httpContext.container.get(SessionStore)
            .store(Cookie.representationOf(session, sessionCookieSecret), session.data, sessionTimeToLiveInSeconds)
            .run();

        result.ifLeft(_ => {
            loggerInstance().error(`${BaseController.name} - update session: failed to save session`);
            throw new Error('Failed to save session');
        });

        this.httpContext.response
            .cookie(sessionCookieName, this.httpContext.request.cookies[sessionCookieName], {
                domain: sessionCookieDomain,
                path: '/',
                httpOnly: true,
                secure: sessionCookieSecureFlag === 'true',
                maxAge: sessionTimeToLiveInSeconds * 1000,
                encode: String
            });
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
}

import { Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { unmanaged } from 'inversify';
import { httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormActionProcessor, FormActionProcessorConstructor } from 'app/controllers/processors/FormActionProcessor';
import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { SessionStoreConfig } from 'app/models/SessionConfig';
import { CHECK_YOUR_APPEAL_PAGE_URI } from 'app/utils/Paths';
import { Navigation, NavigationControl } from 'app/utils/navigation/navigation';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export type FormSanitizeFunction<T> = (body: T) => T;
export type ChangeModeAction = (req: Request, step: keyof NavigationControl) => string;

const createChangeModeAwareNavigationProxy =
    (step: NavigationControl, changeModeAction: ChangeModeAction): NavigationControl => {
        return new Proxy(step, {
            get(target: NavigationControl, propertyName: keyof NavigationControl): any {
                return (req: Request) => {
                    if (req.query.cm === '1') {
                        return changeModeAction(req, propertyName);
                    }
                    return (target[propertyName] as (req: Request) => string).apply(this, [req]);
                };
            }
        });
    };

const defaultChangeModeAction = () => CHECK_YOUR_APPEAL_PAGE_URI;

const sessionConfig: SessionStoreConfig = SessionStoreConfig.createFromEnvironmentVariables();

export interface FormActionHandler {
    handle(request: Request, response: Response): void | Promise<void>;
}

export type FormActionHandlerConstructor = new (...args: any[]) => FormActionHandler;

export class BaseController<FORM> extends BaseAsyncHttpController {
    protected constructor(@unmanaged() readonly template: string,
                          @unmanaged() readonly navigation: Navigation,
                          @unmanaged() readonly validator?: Validator,
                          @unmanaged() readonly formSanitizeFunction?: FormSanitizeFunction<FORM>,
                          @unmanaged() readonly formActionProcessors?: FormActionProcessorConstructor[],
                          @unmanaged() readonly changeModeAction: ChangeModeAction = defaultChangeModeAction) {
        super();
        const navigationControl = createChangeModeAwareNavigationProxy(
            { next: this.navigation.next, previous: this.navigation.previous, signOut: this.navigation.signOut },
            changeModeAction
        );
        this.navigation = { ...navigationControl, actions: this.navigation.actions };
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
        return this.render(
            this.template,
            {
                ...this.prepareViewModel(),
                ...this.prepareNavigationConfig(),
                templateName: this.template,
            }
        );
    }

    /**
     * Builds view model based of request by delegating to {@link prepareViewModelFromSession}.
     * <p>
     * Designed to be overridden.
     */
    protected prepareViewModel(): Record<string, any> & FORM {
        const session: Session | undefined = this.httpContext.request.session;

        return this.prepareViewModelFromSession(session || {} as Session);

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
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

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
                    const validationResult: ValidationResult = await that.validator.validate(request);
                    if (validationResult.errors.length > 0) {
                        return await that.renderWithStatus(UNPROCESSABLE_ENTITY)(
                            that.template,
                            {
                                templateName: that.template,
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
                        const actionProcessor = that
                            .httpContext
                            .container
                            .get<FormActionProcessor>(actionProcessorType);
                        await actionProcessor.process(request);
                    }
                }

                const session: Session | undefined = request.session;

                if (session) {
                    const applicationData: ApplicationData = session
                        .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

                    applicationData.appeal = that
                        .prepareSessionModelPriorSave(applicationData.appeal || {}, request.body);

                    session.setExtraData(APPLICATION_DATA_KEY, applicationData);

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
        const session: Session | undefined = this.httpContext.request.session;

        if (!session) {
            throw new Error('Session was expected but none found');
        }

        await this.httpContext.container.get(SessionStore)
            .store(Cookie.createFrom(this.httpContext.request.cookies[sessionConfig.sessionCookieName]), session!.data,
                sessionConfig.sessionTimeToLiveInSeconds);

        this.httpContext.response
            .cookie(sessionConfig.sessionCookieName, this.httpContext.request.cookies[sessionConfig.sessionCookieName],
                {
                domain: sessionConfig.sessionCookieDomain,
                path: '/',
                httpOnly: true,
                secure: sessionConfig.sessionCookieSecureFlag === 'true',
                maxAge: sessionConfig.sessionTimeToLiveInSeconds * 1000,
                encode: String
            });
    }

    protected prepareNavigationConfig(): any {

        const cmQuery = this.httpContext.request.query.cm;
        const changeMode: boolean = cmQuery ? cmQuery === '1' : false;

        return {
            navigation: {
                back: {
                    href: this.navigation.previous(this.httpContext.request)
                },
                forward: {
                    href: this.navigation.next(this.httpContext.request)
                },
                signOut: {
                    href: this.navigation.signOut(this.httpContext.request)
                },
                actions: this.navigation.actions ? this.navigation.actions(changeMode) : {}
            }
        };
    }
}

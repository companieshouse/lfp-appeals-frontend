import { AnySchema } from '@hapi/joi';
import { SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { BaseController, FormSanitizeFunction } from 'app/controllers/BaseController';
import {
    FormSubmissionProcessor,
    FormSubmissionProcessorConstructor
} from 'app/controllers/processors/FormSubmissionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

type RequestWithNavigation = Request & { navigation: Navigation; };

@provide(Processor)
class Processor implements FormSubmissionProcessor {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) { }

    async process(request: RequestWithNavigation): Promise<void> {
        const session = request.session.unsafeCoerce();
        const applicationData: ApplicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .orDefault({} as ApplicationData);

        const permissions = applicationData?.navigation?.permissions || [];
        const page = request.navigation.next(request);

        if (!permissions.includes(page)) {
            session.saveExtraData(APPLICATION_DATA_KEY, this.updateNavigationPermissions(applicationData, page));

            await this.sessionStore
                .store(Cookie.representationOf(session, getEnvOrThrow('COOKIE_SECRET')), session.data)
                .run();
        }
    }

    private updateNavigationPermissions(applicationData: ApplicationData, page: string): ApplicationData {
        return {
            ...applicationData,
            navigation: {
                permissions: [...applicationData?.navigation?.permissions || [], page]
            }
        };
    }
}

// tslint:disable-next-line: max-classes-per-file
export abstract class SafeNavigationBaseController<FORM> extends BaseController<FORM> {
    protected constructor(template: string,
                          navigation: Navigation,
                          formSchema?: AnySchema,
                          formSanitizeFunction?: FormSanitizeFunction<FORM>,
                          formSubmissionProcessors?: FormSubmissionProcessorConstructor[]) {
        super(template, navigation, formSchema, formSanitizeFunction, [
            ...formSubmissionProcessors || [], Processor
        ]);
    }

    async onGet(): Promise<void> {
        const session = this.httpContext.request.session.unsafeCoerce();
        const applicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .orDefault({
                navigation: {}
            } as ApplicationData);

        if (applicationData.navigation.permissions === undefined) {
            loggerInstance()
                .info(`${SafeNavigationBaseController.name} - onGet: No navigation permissions found.`);
            if (this.httpContext.request.path !== PENALTY_DETAILS_PAGE_URI) {
                return this.httpContext.response.redirect(PENALTY_DETAILS_PAGE_URI);
            }
        } else {
            const permissions = applicationData.navigation.permissions;
            if (!applicationData.navigation.permissions.includes(this.httpContext.request.path)) {
                loggerInstance()
                    .info(`${SafeNavigationBaseController.name} - onGet: Application did not have navigation permissions to access ${this.httpContext.request.path}.`);
                if (this.httpContext.request.path !== PENALTY_DETAILS_PAGE_URI) {
                    return this.httpContext.response.redirect(permissions[permissions.length - 1]);
                }
            }
        }

        return super.onGet();
    }

    async onPost(): Promise<void> {
        (this.httpContext.request as RequestWithNavigation).navigation = this.navigation;
        return super.onPost();
    }
}

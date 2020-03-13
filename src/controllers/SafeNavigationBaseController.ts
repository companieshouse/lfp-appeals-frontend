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
import { ApplicationData, APPEALS_KEY } from 'app/models/Appeal';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

type RequestWithNavigation = Request & { navigation: Navigation }

@provide(InternalProcessor)
class InternalProcessor implements FormSubmissionProcessor {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {}

    async process(request: RequestWithNavigation): Promise<void> {
        const session = request.session.unsafeCoerce();
        const applicationData: ApplicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPEALS_KEY])
            .orDefault({} as ApplicationData);

        const permissions = applicationData?.navigation?.permissions || [];
        const page = request.navigation.next(request);

        if (!permissions.includes(page)) {
            console.log('Updating page permissions');
            session.saveExtraData(APPEALS_KEY, this.updateNavigationPermissions(applicationData, page));
        }

        await this.sessionStore
            .store(Cookie.representationOf(session, getEnvOrDefault('COOKIE_SECRET')), session.data)
            .run();
    }

    private updateNavigationPermissions(appealExtraData: ApplicationData, page: string): ApplicationData {
        return {
            ...appealExtraData,
            navigation: {
                permissions: [...appealExtraData?.navigation?.permissions || [], page]
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
            ...formSubmissionProcessors || [], InternalProcessor
        ]);
    }

    async onGet(): Promise<void> {
        const session = this.httpContext.request.session.unsafeCoerce();
        const applicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPEALS_KEY])
            .orDefault({
                navigation: {}
            } as ApplicationData);

        if(applicationData.navigation.permissions === undefined) {
            console.log('Start of journey');
            if(this.httpContext.request.url !== PENALTY_DETAILS_PAGE_URI){
                return this.httpContext.response.redirect(PENALTY_DETAILS_PAGE_URI);
            }
        } else {
            const permissions = applicationData.navigation.permissions;
            if (!permissions.includes(this.httpContext.request.url)) {
                console.log('Redirecting, No pass to enter: ', this.httpContext.request.url);
                return this.httpContext.response.redirect(permissions[permissions.length - 1]);
            }
        }

        console.log('welcome to: ', this.httpContext.request.url);

        return super.onGet();
    }

    async onPost(): Promise<void> {
        (this.httpContext.request as RequestWithNavigation).navigation =  this.navigation;
        return super.onPost();
    }
}

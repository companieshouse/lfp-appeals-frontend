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
import { AppealExtraData, APPEALS_KEY } from 'app/models/Appeal';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

type RequestWithNavigation = Request & { navigation: Navigation }

@provide(InternalProcessor)
class InternalProcessor implements FormSubmissionProcessor {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {}

    async process(request: RequestWithNavigation): Promise<void> {
        const session = request.session.unsafeCoerce();
        const appealExtraData: AppealExtraData = session.getExtraData()
            .map<AppealExtraData>(data => data[APPEALS_KEY])
            .orDefault({} as AppealExtraData);

        console.log(appealExtraData);

        const visitedPages = appealExtraData?.navigation?.visitedPages || [];
        const page = request.navigation.next(request);

        if (!visitedPages.includes(page)) {
            console.log('Updating page passes');
            session.saveExtraData(APPEALS_KEY, this.updateSessionNavigationWithPagePass(appealExtraData, page));
        }

        await this.sessionStore
            .store(Cookie.representationOf(session, getEnvOrDefault('COOKIE_SECRET')), session.data)
            .run();
    }

    private updateSessionNavigationWithPagePass(appealExtraData: AppealExtraData, pagePass: string): AppealExtraData {
        return {
            ...appealExtraData,
            navigation: {
                visitedPages: [...appealExtraData?.navigation?.visitedPages || [], pagePass]
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
        const appealsExtraData = session.getExtraData()
            .map<AppealExtraData>(data => data[APPEALS_KEY])
            .orDefault({
                navigation: {}
            } as AppealExtraData);

        console.log(appealsExtraData);

        // Check if session navigation is undefined (beginning of journey)
        if(appealsExtraData.navigation.visitedPages === undefined){
            console.log('Start of journey');
            if(this.httpContext.request.url !== PENALTY_DETAILS_PAGE_URI){
                return this.httpContext.response.redirect(PENALTY_DETAILS_PAGE_URI);
            }
        }else{
            const visitedPages = appealsExtraData.navigation.visitedPages;
            console.log(visitedPages);
            if (!visitedPages.includes(this.httpContext.request.url)) {
                console.log('No pass to enter: ', this.httpContext.request.url);
                console.log('Redirecting');
                return this.httpContext.response.redirect(visitedPages[visitedPages.length - 1]);
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

import { Session } from "@companieshouse/node-session-handler";
import { provide } from "inversify-binding-decorators";

import { RequestWithNavigation } from "app/controllers/SafeNavigationBaseController";
import { FormActionProcessor } from "app/controllers/processors/FormActionProcessor";
import { loggerInstance } from "app/middleware/Logger";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { EVIDENCE_UPLOAD_PAGE_URI } from "app/utils/Paths";
import { addPermissionToNavigation } from "app/utils/appeal/extra.data";

@provide(NavigationPermissionProcessor) // eslint-disable-line no-use-before-define
export class NavigationPermissionProcessor implements FormActionProcessor {
    process (request: RequestWithNavigation): void {
        const session: Session | undefined = request.session;

        if (!session) {
            throw new Error("Session Expected but was undefined");
        }

        const applicationData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);

        if (!applicationData) {
            const userId = session.data?.signin_info?.user_profile?.id;
            loggerInstance()
                .debug(`${NavigationPermissionProcessor.name} - process for userId: ${userId}`);

            throw new Error("Application Data expected but was undefined");
        }

        addPermissionToNavigation(applicationData, EVIDENCE_UPLOAD_PAGE_URI);
    }
}

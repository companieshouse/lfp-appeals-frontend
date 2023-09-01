import { Session } from "@companieshouse/node-session-handler";
import { Request } from "express";
import { provide } from "inversify-binding-decorators";

import { FormActionProcessor } from "app/controllers/processors/FormActionProcessor";
import { loggerInstance } from "app/middleware/Logger";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from "app/utils/CommonErrors";
import { CONFIRMATION_PAGE_URI } from "app/utils/Paths";

@provide(SessionCleanupProcessor) // eslint-disable-line no-use-before-define
export class SessionCleanupProcessor implements FormActionProcessor {

    public async process (req: Request): Promise<void> {

        const session: Session | undefined = req.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const appData: ApplicationData | undefined = session.getExtraData<ApplicationData>(APPLICATION_DATA_KEY);

        if (!appData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        appData.submittedAppeal = appData.appeal;

        delete appData.appeal;

        appData.navigation.permissions = [CONFIRMATION_PAGE_URI];

        session.setExtraData(APPLICATION_DATA_KEY, appData);

        loggerInstance().info(`${SessionCleanupProcessor.name} - Session data cleared`);

        return Promise.resolve();
    }

}

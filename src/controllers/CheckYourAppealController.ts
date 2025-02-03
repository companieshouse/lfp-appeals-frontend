import { Session, SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { ISignInInfo, IUserProfile } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import { controller } from "inversify-express-utils";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { AppealStorageFormActionProcessor } from "app/controllers/processors/AppealStorageFormActionProcessor";
import { SessionCleanupProcessor } from "app/controllers/processors/SessionCleanupProcessor";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { ReasonType } from "app/models/fields/ReasonType";
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI, EVIDENCE_QUESTION_URI, SIGNOUT_PAGE_URI } from "app/utils/Paths";
import {
    formatDate,
    getIllPersonFromIllnessReason,
    getReasonFromReasons,
    getReasonType
} from "app/utils/appeal/extra.data";

const template = "check-your-appeal";

const navigation = {
    previous (): string {
        return EVIDENCE_QUESTION_URI;
    },
    next (): string {
        return CONFIRMATION_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware,
    CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class CheckYourAppealController extends SafeNavigationBaseController<any> {
    constructor () {
        super(template, navigation, undefined, undefined, [AppealStorageFormActionProcessor, SessionCleanupProcessor]);
    }

    protected prepareViewModelFromSession (session: Session): Record<string, any> {

        const userProfile: IUserProfile| undefined = session.get<ISignInInfo>(SessionKey.SignInInfo)?.user_profile;

        if (!userProfile) {
            throw new Error("User profile was expected in session but none found");
        }

        const appealData = super.prepareViewModelFromSession(session);
        const appealReasonDetails = getReasonFromReasons(appealData.reasons);
        const appealPenaltyDetails = appealData.penaltyIdentifier;

        const reasonType = getReasonType(appealData.reasons);
        const illness = appealData.reasons.illness;

        const illPersonName = (reasonType === ReasonType.illness)
            ? getIllPersonFromIllnessReason(illness)
            : undefined;
        const illnessStartDate = (reasonType === ReasonType.illness)
            ? formatDate(illness.illnessStart)
            : undefined;
        const illnessEndDate = (reasonType === ReasonType.illness && illness.illnessEnd !== undefined)
            ? formatDate(illness.illnessEnd)
            : undefined;

        const model = {
            createdBy: appealData.createdBy,
            appealReasonDetails,
            appealPenaltyDetails,
            userProfile,
            illPersonName,
            illnessStartDate,
            illnessEndDate
        };

        loggerInstance().debug(loggingMessage(appealData, CheckYourAppealController.name));

        return model;
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        return appeal;
    }
}

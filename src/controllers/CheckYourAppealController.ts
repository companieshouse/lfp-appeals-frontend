import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AppealStorageFormActionProcessor } from 'app/controllers/processors/AppealStorageFormActionProcessor';
import { InternalEmailFormActionProcessor } from 'app/controllers/processors/InternalEmailFormActionProcessor';
import { SessionCleanupProcessor } from 'app/controllers/processors/SessionCleanupProcessor';
import { UserEmailFormActionProcessor } from 'app/controllers/processors/UserEmailFormActionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ReasonType } from 'app/models/fields/ReasonType';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    EVIDENCE_QUESTION_URI
} from 'app/utils/Paths';
import { Region } from 'app/utils/RegionLookup';
import {
    formatDate,
    getIllPersonFromIllnessReason,
    getReasonFromReasons,
    getReasonType
} from 'app/utils/appeal/extra.data';

const template = 'check-your-appeal';

const navigation = {
    previous(): string {
        return EVIDENCE_QUESTION_URI;
    },
    next(): string {
        return CONFIRMATION_PAGE_URI;
    }
};

@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class CheckYourAppealController extends SafeNavigationBaseController<any> {
    constructor() {
        super(template, navigation, undefined, undefined, [AppealStorageFormActionProcessor,
            InternalEmailFormActionProcessor, UserEmailFormActionProcessor, SessionCleanupProcessor]);
        // tslint:disable-next-line: forin
        for (const region in Region) {
            getEnvOrThrow(`${region}_TEAM_EMAIL`);
        }
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {

        const userProfile: IUserProfile| undefined = session.get<ISignInInfo>(SessionKey.SignInInfo)?.user_profile;

        if (!userProfile){
            throw new Error('User profile was expected in session but none found');
        }

        const appealData = super.prepareViewModelFromSession(session);
        const reasonType = getReasonType(appealData.reasons);
        const appealReasonDetails = getReasonFromReasons(appealData.reasons);
        const appealPenaltyDetails = appealData.penaltyIdentifier;
        const appealName = appealData.createdBy?.name;
        const illPersonName = (reasonType === ReasonType.illness )
                                ? getIllPersonFromIllnessReason(appealData.reasons.illness) : undefined;
        const illnessStartDate = (reasonType === ReasonType.illness )
                                ? formatDate(appealData.reasons.illness.illnessStart) : undefined;

        const model = {
          appealReasonDetails,
          appealPenaltyDetails,
          userProfile,
          appealName,
          illPersonName,
          illnessStartDate
        };

        loggerInstance().debug(loggingMessage(appealData, CheckYourAppealController.name));

        return model;
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}

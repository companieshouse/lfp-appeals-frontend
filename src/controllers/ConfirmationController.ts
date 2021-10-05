import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';
import { getReasonFromReasons } from 'app/utils/appeal/extra.data';

const template = 'confirmation';

const navigation = {
    previous(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    },
    next(): string {
        return '';
    }
};

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends SafeNavigationBaseController<any> {
    constructor() {
        super(template, navigation);
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {

        const userProfile: IUserProfile | undefined = session.get<ISignInInfo>(SessionKey.SignInInfo)?.user_profile;

        if (!userProfile) {
            throw new Error('User profile was expected in session but none found');
        }

        const appealData: Appeal | undefined = session
            .getExtraData<ApplicationData>(APPLICATION_DATA_KEY)?.submittedAppeal;

        if (!appealData) {
            throw new Error('Appeal data was expected in session but none found');
        }

        const appealReasonDetails = getReasonFromReasons(appealData.reasons);
        const appealPenaltyDetails = appealData.penaltyIdentifier;

        const model = {
            appealReasonDetails,
            appealPenaltyDetails,
            userProfile
        };

        loggerInstance().debug(loggingMessage(appealData, ConfirmationController.name));

        return model;
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}

import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { controller} from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { InternalEmailFormSubmissionProcessor } from 'app/controllers/processors/InternalEmailFormSubmissionProcessor';
import { UserEmailFormSubmissionProcessor } from 'app/controllers/processors/UserEmailFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPEALS_KEY } from 'app/models/ApplicationData';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI} from 'app/utils/Paths';

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
    constructor () {
        super(template, navigation, undefined, undefined,
            [InternalEmailFormSubmissionProcessor, UserEmailFormSubmissionProcessor]);
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {
        const companyNumber = session
            .getExtraData()
            .chainNullable<ApplicationData>(data => data[APPEALS_KEY])
            .chainNullable(applicationData => applicationData.appeal.penaltyIdentifier)
            .map(penaltyIdentifier => penaltyIdentifier.companyNumber)
            .extract();

        const userEmail = session
            .getValue<ISignInInfo>(SessionKey.SignInInfo)
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.email)
            .extract();

        return {
            ...super.prepareViewModelFromSession(session),
            companyNumber,
            userEmail
        };
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}

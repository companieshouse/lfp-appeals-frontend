import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AppealStorageFormSubmissionProcessor } from 'app/controllers/processors/AppealStorageFormSubmissionProcessor';
import { InternalEmailFormSubmissionProcessor } from 'app/controllers/processors/InternalEmailFormSubmissionProcessor';
import { UserEmailFormSubmissionProcessor } from 'app/controllers/processors/UserEmailFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal'
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';
import { Region } from 'app/utils/RegionLookup';

const template = 'check-your-appeal';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return CONFIRMATION_PAGE_URI;
    }
};

@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends SafeNavigationBaseController<any> {
    constructor () {
        super(template, navigation, undefined, undefined,
            [AppealStorageFormSubmissionProcessor,
                InternalEmailFormSubmissionProcessor,
                UserEmailFormSubmissionProcessor]);
        // tslint:disable-next-line: forin
        for (const region in Region) {
            getEnvOrDefault(`${region}_TEAM_EMAIL`)
        }
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {
        const userProfile = session.getValue<ISignInInfo>(SessionKey.SignInInfo)
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        return {
            ...super.prepareViewModelFromSession(session),
            userProfile
        };
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}

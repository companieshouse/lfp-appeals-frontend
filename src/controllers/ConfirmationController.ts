import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { InternalEmailFormActionProcessor } from 'app/controllers/processors/InternalEmailFormActionProcessor';
import { UserEmailFormActionProcessor } from 'app/controllers/processors/UserEmailFormActionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

const template = 'confirmation';

const navigation = {
    previous(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    },
    next(): string {
        return '';
    }
};

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class ConfirmationController extends SafeNavigationBaseController<any> {
    constructor() {
        super(template, navigation, undefined, undefined, [InternalEmailFormActionProcessor,
            UserEmailFormActionProcessor]);
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

        const model = {
            ...appealData,
            userProfile
        };
        loggerInstance()
            .debug(`${ConfirmationController.name} - prepareViewModelFromSession: ${JSON.stringify(model)}`);
        return model;
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}

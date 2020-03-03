import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from 'app/utils/Paths';
import { Request } from 'express';
import { SessionMiddleware } from 'ch-node-session-handler';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { Appeal } from 'app/models/Appeal';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable<Appeal>(data => data.appeals)
            .chainNullable(appeal => appeal.penaltyIdentifier)
            .map(penaltyIdentifier => penaltyIdentifier.companyNumber)
            .extract();

        const userEmail = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.email)
            .extract();

        return this.render('confirmation', { companyNumber, userEmail });

    }
}

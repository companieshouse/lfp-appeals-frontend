import { SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express';
import { controller, httpGet } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<void> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable<Appeal>(data => data[APPEALS_KEY])
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

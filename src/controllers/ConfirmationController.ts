import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from 'app/utils/Paths';
import { Request } from 'express';
import { SessionMiddleware } from 'ch-node-session-handler';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { AppealKeys } from 'app/models/keys/AppealKeys';
import { PenaltyIdentifierKeys } from 'app/models/keys/PenaltyIdentifierKeys';
import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable(data => data[AppealKeys.APPEALS_KEY])
            .chainNullable(appeals => appeals[AppealKeys.PENALTY_IDENTIFIER])
            .map(penaltyIdentifier => penaltyIdentifier[PenaltyIdentifierKeys.COMPANY_NUMBER])
            .extract();

        const userEmail = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.email)
            .extract();

        return this.render('confirmation', { companyNumber, userEmail });

    }
}

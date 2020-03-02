import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { Request } from 'express';
import { SessionMiddleware } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
<<<<<<< HEAD
import { Appeal } from '../models/Appeal';
import { PenaltyIdentifier } from '../models/PenaltyIdentifier';
=======
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
>>>>>>> origin/master

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
<<<<<<< HEAD
            .chainNullable(data => data.appeals as Appeal)
            .chainNullable(appeals => appeals.penaltyIdentifier as PenaltyIdentifier)
            .map(penaltyIdentifier => penaltyIdentifier.companyNumber)
            .orDefault('');
=======
            .chainNullable(data => data[AppealKeys.APPEALS_KEY])
            .chainNullable(appeals => appeals[AppealKeys.PENALTY_IDENTIFIER])
            .map(penaltyIdentifier => penaltyIdentifier[PenaltyIdentifierKeys.COMPANY_NUMBER])
            .extract();
>>>>>>> origin/master

        const userEmail = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.email)
            .extract();

        return this.render('confirmation', { companyNumber, userEmail });

    }
}

import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { Request } from 'express';
import { SessionMiddleware } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { Appeal, APPEALS_KEY } from '../models/Appeal';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

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

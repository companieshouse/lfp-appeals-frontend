import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { Request } from 'express';
import { SessionMiddleware, Maybe } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AppealKeys } from '../models/keys/AppealKeys';
import { PenaltyIdentifierKeys } from '../models/keys/PenaltyIdentifierKeys';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable(data => data[AppealKeys.APPEALS_KEY])
            .chainNullable(appeals => appeals[AppealKeys.PENALTY_IDENTIFIER])
            .map(penaltyIdentifier => penaltyIdentifier[PenaltyIdentifierKeys.COMPANY_NUMBER])
            .orDefault({});

        return this.render('confirmation', { companyNumber });

    }
}

import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { Request } from 'express';
import { SessionMiddleware, Maybe } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { Appeal } from '../models/Appeal';
import { PenaltyIdentifier } from '../models/PenaltyIdentifier';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<string> {

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable(data => data.appeals as Appeal)
            .chainNullable(appeals => appeals.penaltyIdentifier as PenaltyIdentifier)
            .map(penaltyIdentifier => penaltyIdentifier.companyNumber)
            .orDefault('');

        return this.render('confirmation', { companyNumber });

    }
}

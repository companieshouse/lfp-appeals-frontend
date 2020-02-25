import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { Request } from 'express';
import { SessionMiddleware } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseHttpController {

    @httpGet('')
    public getConfirmationView(req: Request): void {

        req.session.chain(_ => _.getExtraData())
            .map(data => data.appeals.penaltyIdentifier.companyNumber)
            .map(companyNumber => this.httpContext.response.render('confirmation', { companyNumber }))
            .ifNothing(() => this.httpContext.response.render('confirmation', {}));

    }
}

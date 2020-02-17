import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';
import { ROOT_URI, ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';
import { inject } from 'inversify';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

@controller(ROOT_URI)
export class LandingController extends BaseAsyncHttpController {

    constructor(@inject(AuthMiddleware) private readonly auth: AuthMiddleware) {
        super();
    }

    @httpGet('')
    public async renderView(req: Request, res: Response, next: NextFunction): Promise<string> {
        return this.render('landing', { penaltyDetailsPage: PENALTY_DETAILS_PAGE_URI });
    }

    @httpPost('')
    public async continue(req: Request, res: Response): Promise<any> {
        return this.redirect(ENTRY_PAGE_URI).executeAsync();
    }
}

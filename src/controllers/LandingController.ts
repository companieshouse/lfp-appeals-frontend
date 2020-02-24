import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { ROOT_URI, ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

@controller(ROOT_URI)
export class LandingController extends BaseAsyncHttpController {

    @httpGet('')
    public async renderView(): Promise<string> {
        return this.render('landing', { penaltyDetailsPage: PENALTY_DETAILS_PAGE_URI });
    }

    @httpPost('')
    public async continue(): Promise<any> {
        return this.redirect(ENTRY_PAGE_URI).executeAsync();
    }
}

import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { PENALTY_DETAILS_PREFIX, ENTRY_URI } from '../utils/Paths';

@controller(ENTRY_URI)
export class EntryController extends BaseHttpController{

    @httpGet('')
    public redirectView(): void {
        this.httpContext.response.redirect(PENALTY_DETAILS_PREFIX);
    }
}
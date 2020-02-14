import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { PENALTY_DETAILS_PREFIX, ENTRY_PREFIX } from '../utils/Paths';

@controller(ENTRY_PREFIX)
export class EntryController extends BaseHttpController{
    
    @httpGet('')
    public renderView(req: Request, res: Response, next: NextFunction): void {
        this.httpContext.response.redirect(PENALTY_DETAILS_PREFIX);
    }
}
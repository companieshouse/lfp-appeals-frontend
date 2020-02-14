import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';
import { PENALTY_DETAILS_PREFIX, ENTRY_URI } from '../utils/Paths';

@controller('/')
export class LandingController extends BaseHttpController {

    @httpGet('')
    public renderView(req: Request, res: Response, next: NextFunction): void {
        res.render('landing');
    }

    @httpPost('')
    public continue(): void {
        this.httpContext.response.redirect(ENTRY_URI);
    }
}

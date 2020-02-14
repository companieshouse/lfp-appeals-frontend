import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';
<<<<<<< HEAD
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
=======
>>>>>>> 4f447de769bdd415ba797276d7a987341325f6e2

@controller('/')
export class LandingController extends BaseHttpController {

    @httpGet('')
    public renderView(req: Request, res: Response, next: NextFunction): void {
        res.render('landing');
    }

    @httpPost('')
    public continue(): void {
<<<<<<< HEAD
        this.httpContext.response.redirect(PENALTY_DETAILS_PREFIX);
=======
        this.httpContext.response.redirect('/penalty-reference');
>>>>>>> 4f447de769bdd415ba797276d7a987341325f6e2
    }
}

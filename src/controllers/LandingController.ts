import { Request, Response, NextFunction } from 'express';
import { controller, httpGet } from 'inversify-express-utils';

@controller('/')
export class LandingController {

    @httpGet('')
    public renderView(req: Request, res: Response, next: NextFunction): void {
        res.render('landing');
    }
}

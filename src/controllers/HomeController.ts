import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';

@controller('/')
export class HomeController extends BaseHttpController {

    constructor() {
        super();
    }

    @httpGet('index')
    public sayHello(req: Request, res: Response, next: NextFunction): void {
        res.render('index');
    }
}

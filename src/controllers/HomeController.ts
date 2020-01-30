import { Request, Response, NextFunction } from 'express';
import { controller, httpGet } from 'inversify-express-utils';

@controller('/home')
export class HomeController {

    @httpGet('/')
    public sayHello(req: Request, res: Response, next: NextFunction): void {
        res.render('index');
    }
}

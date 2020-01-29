import { Request, Response, NextFunction } from 'express';

export class HomeController {

    public sayHello = (req: Request, res: Response, next: NextFunction) => res.render('landing');
}

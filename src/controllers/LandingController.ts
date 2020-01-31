import { Request, Response, NextFunction } from 'express';

export class LandingController {

    public renderView = (req: Request, res: Response, next: NextFunction) => res.render('landing');
}

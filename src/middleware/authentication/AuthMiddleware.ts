import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';

@provide(AuthMiddleware)
export class AuthMiddleware extends BaseMiddleware {

    public constructor() {
        super();
    }

    public handler(req: Request, res: Response, next: NextFunction): void {
        console.log('Auth')
        next();
    }

}
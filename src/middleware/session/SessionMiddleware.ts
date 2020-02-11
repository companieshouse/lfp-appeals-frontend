import { BaseMiddleware } from 'inversify-express-utils';
import { provide } from 'inversify-binding-decorators';
import { Response, Request, NextFunction } from 'express';
import { inject } from 'inversify';
import { RedisService } from '../../services/RedisService';

@provide(SessionMiddleware)
export class SessionMiddleware extends BaseMiddleware {

    public constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    public handler(req: Request, res: Response, next: NextFunction): void {

        if (!req.cookies || !req.cookies.__SID) {
            console.log('no cookies');
            const signinUrl: string = process.env.SIGN_IN_URL + '';
            res.redirect(signinUrl);
        } else {
            console.log('cookie!')
            res.redirect('/start')
        }
        next();
    }


}
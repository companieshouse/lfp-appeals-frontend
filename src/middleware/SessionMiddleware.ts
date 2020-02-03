import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { RedisService } from '../services/RedisService';
import { TYPES } from '../Types';

@injectable()
export class SessionMiddleware extends BaseMiddleware {

    constructor(@inject(TYPES.RedisService) private readonly redisService: RedisService) {
        super();
    }

    public handler(req: Request, res: Response, next: NextFunction): void {
        this.redisService.getObject('session').then((session: any) => {
            console.log(session)
            if (!session) {
                console.log('No session. Creating a new session');
                this.redisService.setObject('session',  {example: 'test', data: 'cookie'});
            } else {
                console.log('Session exists');
            }
            console.log('next');
        });

        next();
    }

}

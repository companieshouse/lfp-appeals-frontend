import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { RedisService, setAsync, getAsync } from '../services/RedisService';
import { TYPES } from '../Types';

@injectable()
export class SessionMiddleware extends BaseMiddleware {

    constructor(@inject(TYPES.RedisService) private readonly redisService: RedisService) {
        super();
    }

    public handler(req: Request, res: Response, next: NextFunction): void {
        const client = this.redisService.client;
        getAsync(client)('session').then((session: any) => {
            if (!session) {
                console.log('No session. Creating a new session');
                setAsync(client)('session', 'new session');
            } else {
                console.log('Session exists');
            }
            console.log('next');
        });

        next();
    }

}

import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { RedisService, setAsync, getAsync } from '../services/RedisService';
import { TYPES } from '../Types';
import { RedisClient } from 'redis';

@injectable()
export class SessionMiddleware extends BaseMiddleware {

    private readonly client: RedisClient;

    constructor(@inject(TYPES.RedisService) readonly redisService: RedisService) {
        super();
        this.client = this.redisService.getClient();
    }

    public handler(req: Request, res: Response, next: NextFunction): void {
        if (req.method === 'GET') {
            this.onGet();
        } else if (req.method === 'POST') {
            this.onPost();
        }
        next();
    }

    private onPost(): void {
        console.log('POST');
    }

    private onGet(): void {
        console.log('GET');
        getAsync(this.client)('session').then((session) => {
            if (!session) {
                console.log('No session. Creating a new session');
                setAsync(this.client)('session', 'new session');
            } else {
                console.log('Session exists');
            }
        });
    }

}

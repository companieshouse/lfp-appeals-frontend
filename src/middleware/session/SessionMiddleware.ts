import { BaseMiddleware } from 'inversify-express-utils';
import { provide } from 'inversify-binding-decorators';
import { Response, Request, NextFunction, RequestHandler } from 'express';
import { inject } from 'inversify';
import { RedisService } from '../../services/RedisService';
import { CHSessionMiddleware } from 'ch-node-session'
import { ENV } from '../../utils/ConfigLoader';

@provide(SessionMiddleware)
export class SessionMiddleware extends BaseMiddleware {

    private sessionRequestHandler: RequestHandler;

    public constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
        this.sessionRequestHandler = CHSessionMiddleware({
            cacheDB: ENV.CACHE_DB,
            cachePassword: ENV.CACHE_PASSWORD,
            cacheServer: ENV.CACHE_SERVER,
            cookieName: ENV.COOKIE_NAME,
            cookieSecret: ENV.COOKIE_SECRET,
            defaultSessionExpiration: ENV.DEFAULT_SESSION_EXPIRATION
        })
    }

    public async handler(req: Request, res: Response, next: NextFunction): Promise<void> {

        return await this.sessionRequestHandler(req, res, next)
    }


}
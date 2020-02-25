import { Container } from 'inversify';
import { RedisClient } from 'redis';
import { buildProviderModule } from 'inversify-binding-decorators';
import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import IORedis = require('ioredis');
import { RequestHandler } from 'express';
import { returnEnvVarible } from './utils/EnvironmentUtils';
import { AuthMiddleware } from './middleware/AuthMiddleware';
const disconnectClient = (redisClient: RedisClient) => redisClient.flushall();

export function createContainer(): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: returnEnvVarible('COOKIE_NAME'),
        cookieSecret: returnEnvVarible('COOKIE_SECRET'),
    };
    const sessionStore = new SessionStore(new IORedis({
        host: returnEnvVarible('CACHE_SERVER'),
        password: returnEnvVarible('CACHE_PASSWORD', ''),
        db: Number(returnEnvVarible('CACHE_DB'))
    }));
    const sessionHandler = SessionMiddleware(config, sessionStore);

    const authMiddleware = new AuthMiddleware();

    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind<SessionStore>(SessionStore).toConstantValue(sessionStore);
    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(authMiddleware);
    container.load(buildProviderModule());
    return container;
}

import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';
import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import IORedis = require('ioredis');
import { RequestHandler } from 'express';
import { getEnvOrDefault } from './utils/EnvironmentUtils';
import { AuthMiddleware } from './middleware/AuthMiddleware';

export function createContainer(): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: getEnvOrDefault('COOKIE_NAME'),
        cookieSecret: getEnvOrDefault('COOKIE_SECRET'),
    };
    const sessionStore = new SessionStore(new IORedis({
        host: getEnvOrDefault('CACHE_SERVER'),
        password: getEnvOrDefault('CACHE_PASSWORD', ''),
        db: Number(getEnvOrDefault('CACHE_DB'))
    }));
    const sessionHandler = SessionMiddleware(config, sessionStore);

    const authMiddleware = new AuthMiddleware();

    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind<SessionStore>(SessionStore).toConstantValue(sessionStore);
    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(authMiddleware);
    container.load(buildProviderModule());
    return container;
}

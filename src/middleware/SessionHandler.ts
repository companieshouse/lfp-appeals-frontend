import * as session from 'express-session';
import * as redis from 'redis';
import { RedisClient } from 'redis';

const DEFAULT_COOKIE: any = {
    maxAge: 360,
    signed: true,
    sameSite: true,
};

const SESSION_OPTIONS: session.SessionOptions = {
    name: 'Default Session',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: DEFAULT_COOKIE,
};

class SessionHandler {

    public createNewSession(): RedisClient {
        return redis.createClient({
            host: '127.0.0.1',
            port: 6379,
        });
    }

    public disconnectSession = (redisClient: RedisClient) => redisClient.end();

}
let sessionHandler: SessionHandler;
export const SessionHandlerInstance = () => !sessionHandler ? sessionHandler = new SessionHandler() : sessionHandler;
export const sessionHandlerFunction = session(SESSION_OPTIONS);

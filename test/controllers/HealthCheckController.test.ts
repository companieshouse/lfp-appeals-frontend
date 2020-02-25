import 'reflect-metadata';
import '../global';
import {Application, RequestHandler} from 'express';
import * as request from 'supertest';
import {createApplication, setupFakeAuth} from '../ApplicationFactory';
import '../../src/controllers/HealthCheckController';
import { HEALTH_CHECK_URI } from '../../src/utils/Paths';
import {CookieConfig, SessionMiddleware, SessionStore} from 'ch-node-session';
import { Redis } from 'ioredis';
import { returnEnvVarible } from '../../src/utils/EnvironmentUtils';


describe('HealthCheckController', () => {


    it('should return 200 with status when redis database is up', async () => {
        const app = createApplication(container => {

            const redis = {
                ping: () => Promise.resolve('OK')
            } as Redis;

            const config: CookieConfig = {
                cookieName: returnEnvVarible('COOKIE_NAME'),
                cookieSecret: returnEnvVarible('COOKIE_SECRET')
            };

            const sessionStore = new SessionStore(redis);
            const sessionHandler = SessionMiddleware(config, sessionStore);
            setupFakeAuth(container);
            container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
            container.bind(SessionStore).toConstantValue(new SessionStore(redis));

        });

        await makeHealthCheckRequest(app).expect(200);
    });

    it('should return 500 with status when redis database is down', async () => {
        const app = createApplication(container => {
            const redis = {
                ping: async () => new Promise(() => {
                    throw Error();
                })

            } as Redis;

            const config: CookieConfig = {
                cookieName: returnEnvVarible('COOKIE_NAME'),
                cookieSecret: returnEnvVarible('COOKIE_SECRET')
            };

            const sessionStore = new SessionStore(redis);
            const sessionHandler = SessionMiddleware(config, sessionStore);
            setupFakeAuth(container);
            container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
            container.bind(SessionStore).toConstantValue(new SessionStore(redis));
        });

        await makeHealthCheckRequest(app).expect(500);
    });

    function makeHealthCheckRequest(app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

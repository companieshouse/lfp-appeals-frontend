import 'reflect-metadata';
import '../../src/controllers/index';
import '../global';

import { CookieConfig, SessionStore, SessionMiddleware } from 'ch-node-session';
import { generateSessionId, generateSignature } from 'ch-node-session/lib/utils/CookieUtils';
import { createApplication } from '../ApplicationFactory';
import Substitute from '@fluffy-spoon/substitute';
import { Redis } from 'ioredis';
import { RequestHandler} from 'express';
import { BaseMiddleware } from 'inversify-express-utils';

import { expect } from 'chai';
import * as request from 'supertest';
import { PENALTY_DETAILS_PAGE_URI } from '../../src/utils/Paths';
import { loadEnvironmentVariablesFromFiles, returnEnvVarible } from '../../src/utils/ConfigLoader';
import { AuthMiddleware } from '../../src/middleware/AuthMiddleware';


const createApp = (middleware: RequestHandler) => createApplication(container => {

    const redis = Substitute.for<Redis>();
    const sessionStore = new SessionStore(redis);
    const sessionHandler = SessionMiddleware(config, sessionStore);

    class FakeMiddleware extends BaseMiddleware {
        handler: RequestHandler = middleware;
    }

    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(new FakeMiddleware());
    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(SessionStore).toConstantValue(sessionStore);

});

let config: CookieConfig;

describe('Authentication Middleware', () => {

    before('sign in server should be running', async () => {

        process.env.NODE_ENV = 'test';

        loadEnvironmentVariablesFromFiles();
        config = {
            cookieName: returnEnvVarible('COOKIE_NAME'),
            cookieSecret: returnEnvVarible('COOKIE_SECRET')
        };
        const app = createApp(new AuthMiddleware().handler);

        await request(app).get(PENALTY_DETAILS_PAGE_URI).expect(res => expect(res.redirect).true);
    });

    describe('Authed path', () => {
        it('should allow the user to go to the penalty reference screen if authed', async () => {
            const id = generateSessionId();
            const sig = generateSignature(id, config.cookieSecret);
            const cookieString = id + sig;

            const middleware = new AuthMiddleware();
            const app = createApp(middleware.handler);
            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .set('Cookie', `${config.cookieName}=${cookieString}`)
                .expect(200);
        });
    });
    describe('Unauthed path', () => {

        it('should redirect the user to sign in screen if not authed', async () => {

            const app = createApp(new AuthMiddleware().handler);
            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .expect(302).then(res => expect(res.header.location).to.include('/signin'));

        });

    });


});
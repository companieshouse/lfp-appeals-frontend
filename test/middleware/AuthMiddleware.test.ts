import 'reflect-metadata';
import '../../src/controllers/index';
import '../global';

import { CookieConfig, SessionStore, SessionMiddleware } from 'ch-node-session';
import { generateSessionId, generateSignature } from 'ch-node-session/lib/utils/CookieUtils';
import { createApplication } from '../ApplicationFactory';
import Substitute from '@fluffy-spoon/substitute';
import { Redis } from 'ioredis';
import { RequestHandler, Application } from 'express';
import { expect } from 'chai';
import * as request from 'supertest';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import { loadEnvironmentVariablesFromFiles, returnEnvVarible } from '../../src/utils/ConfigLoader';
import { AuthMiddleware } from '../../src/middleware/AuthMiddleware';


let config: CookieConfig;
const appInstance = () => createApplication(container => {

    const redis = Substitute.for<Redis>();
    const sessionStore = new SessionStore(redis);
    config = {
        cookieName: returnEnvVarible('COOKIE_NAME'),
        cookieSecret: returnEnvVarible('COOKIE_SECRET')
    };
    const sessionHandler = SessionMiddleware(config, sessionStore);

    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(new AuthMiddleware());
    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(SessionStore).toConstantValue(sessionStore);

});

describe('Authentication Middleware', () => {

    const app = appInstance();

    describe('Authed path', () => {

        let cookieString: string;
        let penaltyDetails: Record<string, any>;

        before('sign in server should be running', async () => {

            const id = generateSessionId();
            const sig = generateSignature(id, config.cookieSecret);
            cookieString = id + sig;

            penaltyDetails = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            await request(appInstance()).get(PENALTY_DETAILS_PAGE_URI).expect(res => expect(res.redirect).true);

        });

        it('should allow the user to go to the penalty reference screen if authed', async () => {

            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .set('Cookie', `${config.cookieName}=${cookieString}`)
                .expect(200);

        });
        it('should continue to the next page without requiring auth if penalty details are valid', async () => {

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyDetails)
                .set('Cookie', `${config.cookieName}=${cookieString}`)
                .expect(_ => expect(_.header.location).to.include(OTHER_REASON_DISCLAIMER_PAGE_URI));

        });
    });
    describe('Unauthed path', () => {

        before('sign in server should be running', async () => {

            await request(app).get(PENALTY_DETAILS_PAGE_URI).expect(res => expect(res.redirect).true);
        });

        it('should redirect the user to sign in screen when trying to access protected pages', async () => {

            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .expect(302).then(res => expect(res.header.location).to.include('/signin'));

            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(302).then(res => expect(res.header.location).to.include('/signin'));

            await request(app).get(OTHER_REASON_PAGE_URI)
                .expect(302).then(res => expect(res.header.location).to.include('/signin'));

        });

    });


});
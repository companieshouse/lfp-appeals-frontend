import 'reflect-metadata';
import '../../src/controllers/index';
import '../global';

import { CookieConfig, SessionStore, SessionMiddleware, Maybe } from 'ch-node-session';
import { SessionKey } from 'ch-node-session/lib/session/keys/SessionKey';
import { generateSessionId, generateSignature } from 'ch-node-session/lib/utils/CookieUtils';
import { createApplication } from '../ApplicationFactory';
import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { Redis } from 'ioredis';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import * as request from 'supertest';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import { loadEnvironmentVariablesFromFiles, returnEnvVarible } from '../../src/utils/ConfigLoader';
import { AuthMiddleware } from '../../src/middleware/AuthMiddleware';
import { VerifiedSession } from 'ch-node-session/lib/session/model/Session';
import { createFakeSession } from '../utils/session/FakeSessionFactory';

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
    let cookieString: string;
    let penaltyDetails: Record<string, any>;
    const id = generateSessionId();
    const sig = generateSignature(id, config.cookieSecret);
    cookieString = id + sig;

    describe('Authed path', () => {

        before('sign in server should be running', async () => {

            penaltyDetails = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            await request(appInstance()).get(PENALTY_DETAILS_PAGE_URI).expect(res => expect(res.redirect).true);

        });

        it('should not redirect the user to the sign in page if the user is signed in', () => {
            const req = Substitute.for<Request>();
            const res = Substitute.for<Response>();
            const next = Substitute.for<NextFunction>();
            const session = Maybe.of(
                createFakeSession(
                    [{

                        [SessionKey.Id]: id,
                        [SessionKey.ClientSig]: sig,

                    }], true));

            // @ts-ignore
            req.session.returns(session);
            const realAuthMiddleware = new AuthMiddleware();
            res.redirect(Arg.any(), 302).mimicks((url, status) => url)

            realAuthMiddleware.handler(req, res, next);
            // @ts-ignore
            res.received(1).redirect(Arg.any());

            next.received()

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

        it('should redirect the use to the sign in page if the user is not signed in', () => {
            const req = Substitute.for<Request>();
            const res = Substitute.for<Response>();
            const next = Substitute.for<NextFunction>();
            const session = Maybe.of(
                createFakeSession(
                    [{

                        [SessionKey.Id]: id,
                        [SessionKey.ClientSig]: sig,

                    }], false));

            // @ts-ignore
            req.session.returns(session);
            const realAuthMiddleware = new AuthMiddleware();
            res.redirect(Arg.any(), 302).mimicks((url, status) => true)

            realAuthMiddleware.handler(req, res, next);
            res.didNotReceive().redirect(Arg.any(), 302);
            next.received()

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
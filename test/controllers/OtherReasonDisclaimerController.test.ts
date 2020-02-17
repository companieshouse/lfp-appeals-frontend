import 'reflect-metadata'
import '../global'

import '../../src/controllers/OtherReasonDisclaimerController'
import { createApplication, setupFakeAuth } from '../ApplicationFactory';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';
import { expect } from 'chai';
import { OK, MOVED_TEMPORARILY } from 'http-status-codes';
import { CookieConfig, SessionStore, SessionMiddleware } from 'ch-node-session';
import { Redis } from 'ioredis';
import { RequestHandler } from 'express';
import Substitute from '@fluffy-spoon/substitute';

const config: CookieConfig = {
    cookieName: '__SID',
    cookieSecret: 'S+CmgW/ivLEaiFTzm87a1cyH+ZbD81yukx8n7e/efzQ='
};

describe('OtherReasonDisclaimerController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access the other-reason-entry page', async () => {
            const app = createApplication(container => {

                const redis = Substitute.for<Redis>();
                const sessionStore = new SessionStore(redis);
                const sessionHandler = SessionMiddleware(config, sessionStore);
                setupFakeAuth(container);
                container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
                container.bind(SessionStore).toConstantValue(sessionStore);

            });
            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(OK);
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to reason-other page', async () => {
            const app = createApplication(container => {

                const redis = Substitute.for<Redis>();
                const sessionStore = new SessionStore(redis);
                const sessionHandler = SessionMiddleware(config, sessionStore);
                setupFakeAuth(container);
                container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
                container.bind(SessionStore).toConstantValue(sessionStore);

            });
            await request(app).post(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_PAGE_URI);
                })
        });
    });
});

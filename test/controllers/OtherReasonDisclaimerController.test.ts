import 'reflect-metadata'

import '../../src/controllers/OtherReasonDisclaimerController'
import { createAppConfigurable, setupFakeAuth } from '../ApplicationFactory';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import * as request from 'supertest'
import { expect } from 'chai';
import { OK, MOVED_TEMPORARILY } from 'http-status-codes';
import { CookieConfig, SessionStore, SessionMiddleware } from 'ch-node-session-handler';
import { Redis } from 'ioredis';
import { RequestHandler } from 'express';
import { getEnvOrDefault } from '../../src/utils/EnvironmentUtils';


describe('OtherReasonDisclaimerController', () => {

    const app = createAppConfigurable(container => {

        const redis = {
            ping: () => Promise.resolve('OK')
        } as Redis;

        const config: CookieConfig = {
            cookieName: getEnvOrDefault('COOKIE_NAME'),
            cookieSecret: getEnvOrDefault('COOKIE_SECRET')
        };

        const sessionStore = new SessionStore(redis);
        const sessionHandler = SessionMiddleware(config, sessionStore);
        setupFakeAuth(container);
        container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
        container.bind(SessionStore).toConstantValue(new SessionStore(redis));

    });

    describe('GET request', () => {
        it('should return 200 when trying to access the other-reason-entry page', async () => {

            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(OK);
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to reason-other page', async () => {

            await request(app).post(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_PAGE_URI);
                })
        });
    });
});

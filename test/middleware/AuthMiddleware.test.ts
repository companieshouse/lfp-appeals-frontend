import 'reflect-metadata';
import '../../src/controllers/index';
import { expect, assert } from 'chai';
import * as request from 'supertest';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { Maybe, VerifiedSession } from 'ch-node-session-handler';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { generateSessionId, generateSignature } from 'ch-node-session-handler/lib/utils/CookieUtils';

const config = getDefaultConfig();
const id = generateSessionId();
const sig = generateSignature(id, config.cookieSecret);

const session = createFakeSession(
    [{
        [SessionKey.Id]: id
    }, {
        [SessionKey.ClientSig]: sig
    }], config.cookieSecret, true);

const authedApp = createApp(session);

const protectedPages = [
    PENALTY_DETAILS_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
];

describe('Authentication Middleware', () => {


    describe('Authed path', () => {

        let penaltyDetails: Record<string, any>;

        before('sign in server should be running', async () => {

            penaltyDetails = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            await request(createApp())
                .get(PENALTY_DETAILS_PAGE_URI)
                .catch(err => assert.fail(err));


        });

        it('should not redirect the user to the sign in page if the user is signed in', async () => {

            for (const page of protectedPages) {
                await request(authedApp).get(page)
                    .expect(200);
            }

        });

        it('should allow the user to go to the penalty reference screen if authed', async () => {

            await request(authedApp)
                .get(PENALTY_DETAILS_PAGE_URI)
                .expect(200);

        });
        it('should continue to the next page without requiring auth if penalty details are valid', async () => {

            await request(authedApp)
                .post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyDetails)
                .expect(_ => expect(_.header.location).to.include(OTHER_REASON_DISCLAIMER_PAGE_URI));

        });
    });
    describe('Unauthed path', () => {

        const appWithoutCookie = { label: 'App without Cookie', app: createApp(session, false) };
        const unAuthedApp = { label: 'App without Cookie and Session', app: createApp() };

        const unAuthedAppStateVariations = [appWithoutCookie, unAuthedApp];

        before('sign in server should be running', async () => {

            await request(createApp())
                .get(PENALTY_DETAILS_PAGE_URI)
                .catch(err => assert.fail(err));
        });

        it('should redirect the user to sign in screen when trying to access protected pages', async () => {

            for (const variation of unAuthedAppStateVariations) {
                for (const page of protectedPages) {
                    await request(variation.app).get(page)
                        .expect(302).then(res => expect(res.header.location).to.include('/signin'));
                }

            }

        });

    });

    describe('Auth Edge case', () => {

        const appWithoutSessionObject = createApp(createFakeSession([], config.cookieSecret), true);

        before('sign in server should be running', async () => {

            await request(createApp())
                .get(PENALTY_DETAILS_PAGE_URI)
                .catch(err => assert.fail(err));
        });

        it('should allow user to access protected pages if session object is somehow lost.', async () => {

            for (const page of protectedPages) {
                await request(appWithoutSessionObject).get(page)
                    .expect(200);
            }

        });
    });


});

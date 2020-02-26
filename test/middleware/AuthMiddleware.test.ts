import 'reflect-metadata';
import '../../src/controllers/index';
import { expect } from 'chai';
import * as request from 'supertest';
import {
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    PENALTY_DETAILS_PAGE_URI
} from '../../src/utils/Paths';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { generateSessionId, generateSignature } from 'ch-node-session-handler/lib/utils/CookieUtils';
import { PenaltyIdentifier } from '../../src/models/PenaltyIdentifier';

const config = getDefaultConfig();
const id = generateSessionId();
const sig = generateSignature(id, config.cookieSecret);

const session = createFakeSession(
    [{
        [SessionKey.Id]: id
    }, {
        [SessionKey.ClientSig]: sig
    }], config.cookieSecret, true);

const protectedPages = [
    PENALTY_DETAILS_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
];

describe('Authentication Middleware', () => {

    const authedApp = createApp(session);

    describe('Authed path', () => {

        const penaltyIdentifier: PenaltyIdentifier = {
            penaltyReference: 'A12345678',
            companyNumber: 'SC123123'
        };

        it('should not redirect the user to the sign in page if the user is signed in', async () => {

            for (const page of protectedPages) {
                await request(authedApp).get(page)
                    .expect(200);
            }

        });

        it('should continue to the next page without requiring auth if penalty details are valid', async () => {

            await request(authedApp)
                .post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(_ => expect(_.header.location).to.include(OTHER_REASON_DISCLAIMER_PAGE_URI));

        });
    });
    describe('no session scenario', () => {
        it('should redirect the user to sign in screen when trying to access protected pages', async () => {
            const appWithoutSession = createApp()

            for (const page of protectedPages) {
                await request(appWithoutSession).get(page)
                    .expect(302).then(res => expect(res.header.location).to.include('/signin'));
            }
        });

    });
});

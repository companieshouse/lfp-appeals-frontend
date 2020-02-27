import 'reflect-metadata'

import '../../src/controllers/OtherReasonDisclaimerController'
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import * as request from 'supertest'
import { expect } from 'chai';
import { OK, MOVED_TEMPORARILY } from 'http-status-codes';
import { createFakeSession } from '../utils/session/FakeSessionFactory';

const config = getDefaultConfig();

describe('OtherReasonDisclaimerController', () => {

    const session = createFakeSession([], config.cookieSecret, true);
    const app = createApp(session)

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

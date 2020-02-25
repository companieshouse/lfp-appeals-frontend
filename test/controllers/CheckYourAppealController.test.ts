import 'reflect-metadata';
import '../../src/controllers/CheckYourAppealController';
import * as request from 'supertest';
import { SUBMISSION_SUMMARY_PAGE_URI } from '../../src/utils/Paths';
import { OK } from 'http-status-codes';
import { expect } from 'chai';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { createFakeSession } from '../utils/session/FakeSessionFactory';

const config = getDefaultConfig();

describe('CheckYourAppealController', () => {
    describe('GET request', () => {
        it('should return 200 when trying to access the submission summary with a session ', async () => {
            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);
            await request(app).get(SUBMISSION_SUMMARY_PAGE_URI).expect(OK);
        });

        it('session data should be populated', async () => {

            const details: Record<string, any> = {
                companyNumber: '00345567',
                penaltyReference: 'A00000001',
                email: 'joe@bloggs.mail',
                reason: {
                    otherReason: 'I have reasons',
                    otherInformation: 'They are legit'
                }
            };


            let session = createFakeSession([], config.cookieSecret, true);
            session = session.saveExtraData('appeals', details);
            const app = createApp(session);

            await request(app).get(SUBMISSION_SUMMARY_PAGE_URI)
                .expect(response => {
                    expect(response.text)
                        .to.contain(details.companyNumber).and
                        .to.contain(details.penaltyReference).and
                        .to.contain(details.email).and
                        .to.contain(details.reason.otherReason).and
                        .to.contain(details.reason.otherInformation);
                });
        });
    });
});

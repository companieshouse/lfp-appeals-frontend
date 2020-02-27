import 'reflect-metadata';
import '../../src/controllers/CheckYourAppealController';
import * as request from 'supertest';
import { CHECK_YOUR_APPEAL_PAGE_URI } from '../../src/utils/Paths';
import { OK } from 'http-status-codes';
import { expect } from 'chai';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { Appeal } from '../../src/models/Appeal';

const config = getDefaultConfig();

describe('CheckYourAppealController', () => {
    describe('GET request', () => {

        it('should return 200 with populated session data', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: '00345567',
                    penaltyReference: 'A00000001',
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal


            let session = createFakeSession([], config.cookieSecret, true);
            session = session.saveExtraData('appeals', appeal);
            const app = createApp(session);

            await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK)
                    expect(response.text)
                        .to.contain(appeal.penaltyIdentifier.companyNumber).and
                        .to.contain(appeal.penaltyIdentifier.penaltyReference).and
                        .to.contain('test').and
                        .to.contain(appeal.reasons.other.title).and
                        .to.contain(appeal.reasons.other.description)

                });
        });

        it('should return 200 with no populated session data', async () => {

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK)
                });
        });
    });
});

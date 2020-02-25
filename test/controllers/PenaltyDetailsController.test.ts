import 'reflect-metadata';

import { createApp, getDefaultConfig } from '../ApplicationFactory';
import * as request from 'supertest';
import '../../src/controllers/PenaltyDetailsController';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { expect } from 'chai';
import { PenaltyIdentifier } from '../../src/models/PenaltyIdentifier';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../../src/utils/Paths';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { sessionKey } from '../../src/controllers/PenaltyDetailsController';

const pageHeading = 'What are the penalty details?';
const errorSummaryHeading = 'There is a problem with the information you entered';

const config = getDefaultConfig();

describe('PenaltyDetailsController', () => {
    describe('GET request', () => {
        it('should return 302 when trying to access page without a session', async () => {
            await request(createApp()).get(PENALTY_DETAILS_PAGE_URI)
                .expect(MOVED_TEMPORARILY);
        });

        it('should return 200 when trying to access page with a session', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };
            let session = createFakeSession([], config.cookieSecret, true);
            session = session.saveExtraData(sessionKey, penaltyIdentifier);
            const app = createApp(session);

            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain(penaltyIdentifier.companyNumber)
                        .and.to.contain(penaltyIdentifier.penaltyReference)
                        .and.not.contain(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to disclaimer page when posting valid penalty details', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };
            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_DISCLAIMER_PAGE_URI);
                })
                .then(_ => expect(session.getExtraData().unsafeCoerce()[sessionKey]).to.deep.equal(penaltyIdentifier));

        });

        it('should return 400 when posting empty penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '',
                companyNumber: 'SC123123'
            };

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter a penalty reference number');
                });
        });

        it('should return 400 when posting invalid penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '12345678',
                companyNumber: 'SC123123'
            };

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter your reference number exactly as shown on your penalty notice');
                });
        });

        it('should return 400 when posting empty company number', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: ''
            };

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter a company number');
                });
        });

        it('should return 400 when posting invalid company number', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'AB66666666'
            };

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter your full eight character company number');
                });
        });
    });
});

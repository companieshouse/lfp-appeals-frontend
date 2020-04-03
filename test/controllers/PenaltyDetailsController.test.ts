import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/PenaltyDetailsController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Navigation } from 'app/models/Navigation';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const pageHeading = 'What are the penalty details?';
const errorSummaryHeading = 'There is a problem with the information you entered';

const config = getDefaultConfig();

describe('PenaltyDetailsController', () => {

    const navigation: Navigation = {} as Navigation;

    describe('GET request', () => {

        const appeal = {
            penaltyIdentifier: {
                companyNumber: '00345567',
                penaltyReference: 'A00000001',
            }
        } as Appeal;

        const applicationData: ApplicationData = { appeal, navigation };

        it('should return 200 when trying to access page with a session', async () => {

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);
            const app = createApp(session);

            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain(appeal.penaltyIdentifier.companyNumber)
                        .and.to.contain(appeal.penaltyIdentifier.penaltyReference)
                        .and.not.contain(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to disclaimer page when posting valid penalty details', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: '00345567',
                    penaltyReference: 'A00000001',
                }
            } as Appeal;

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, { appeal });
            const app = createApp(session);

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_DISCLAIMER_PAGE_URI);
                })

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

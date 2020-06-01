import 'reflect-metadata';

import ApiClient from 'ch-sdk-node/dist/client';
import { LateFilingPenaltyService, Penalty } from 'ch-sdk-node/dist/services/lfp';
import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/PenaltyDetailsController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { Navigation } from 'app/models/Navigation';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { AuthMethod, CompaniesHouseSDK } from 'app/modules/Types';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

const pageHeading = 'What are the penalty details?';
const errorSummaryHeading = 'There is a problem with the information you entered';

describe('PenaltyDetailsController', () => {

    const navigation = {} as Navigation;

    describe('GET request', () => {

        const appeal = {
            penaltyIdentifier: {
                companyNumber: '00345567',
                penaltyReference: 'A00000001',
            }
        } as Appeal;

        const applicationData = {
            appeal,
            navigation
        } as ApplicationData;

        it('should return 200 when trying to access page with a session', async () => {

            const app = createApp(applicationData);

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
                    companyNumber: 'SC123123',
                    penaltyReference: 'A12345678',
                }
            } as Appeal;

            const lfpService = createSubstituteOf<LateFilingPenaltyService>();


            lfpService.getPenalties('SC123123').resolves({
                httpStatusCode: 200,
                resource: {
                    etag: '',
                    itemsPerPage: 1,
                    startIndex: 1,
                    totalResults: 1,
                    items: [{
                        id: '12345678',
                        type: 'penalty'
                    }] as Penalty[]
                }
            });

            const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
                sdk.lateFilingPenalties.returns!(lfpService);
            });

            const app = createApp({ appeal }, container => {
                container.rebind(CompaniesHouseSDK).toConstantValue(companiesHouseSDK);
            });


            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_DISCLAIMER_PAGE_URI);
                });

        });

        it('should return validation error if company number not in E5', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'SC123123',
                    penaltyReference: 'A12312323',
                }
            } as Appeal;

            const lfpService = createSubstituteOf<LateFilingPenaltyService>();

            lfpService.getPenalties('SC123123').throws(new Error('Cannot read property \'map\' of null'));

            const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
                sdk.lateFilingPenalties.returns!(lfpService);
            });

            const app = createApp({ appeal }, container => {
                container.rebind(CompaniesHouseSDK).toConstantValue(companiesHouseSDK);
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('Check that you’ve entered the correct company number')
                        .and.to.contain('Check that you’ve entered the correct reference number');
                });
        });

        // tslint:disable-next-line: max-line-length
        it('should return validation error if modern penalty number does not correspond company number in E5', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'SC123123',
                    penaltyReference: 'A12312323',
                }
            } as Appeal;

            const lfpService = createSubstituteOf<LateFilingPenaltyService>();


            lfpService.getPenalties('SC123123').resolves({
                httpStatusCode: 200,
                resource: {
                    etag: '',
                    itemsPerPage: 1,
                    startIndex: 1,
                    totalResults: 1,
                    items: [{
                        id: '12123123',
                        type: 'penalty'
                    }] as Penalty[]
                }
            });

            const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
                sdk.lateFilingPenalties.returns!(lfpService);
            });

            const app = createApp({ appeal }, container => {
                container.rebind(CompaniesHouseSDK).toConstantValue(companiesHouseSDK);
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('Check that you’ve entered the correct company number')
                        .and.to.contain('Check that you’ve entered the correct reference number');
                });
        });

        it('should return validation error if no penalties correspond to company number', async () => {
            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'SC123123',
                    penaltyReference: 'PEN1A/12312323',
                }
            } as Appeal;

            const lfpService = createSubstituteOf<LateFilingPenaltyService>();


            lfpService.getPenalties('SC123123').resolves({
                httpStatusCode: 200,
                resource: {
                    etag: '',
                    itemsPerPage: 1,
                    startIndex: 1,
                    totalResults: 1,
                    items: [] as Penalty[]
                }
            });

            const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
                sdk.lateFilingPenalties.returns!(lfpService);
            });

            const app = createApp({ appeal }, container => {
                container.rebind(CompaniesHouseSDK).toConstantValue(companiesHouseSDK);
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('Check that you’ve entered the correct company number')
                        .and.to.contain('Check that you’ve entered the correct reference number');
                });
        });

        it('should return 400 when posting empty penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '',
                companyNumber: 'SC123123'
            };

            const app = createApp({});

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
                penaltyReference: '0',
                companyNumber: 'SC123123'
            };

            const app = createApp({});

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

            const app = createApp({});

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

            const app = createApp({});

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

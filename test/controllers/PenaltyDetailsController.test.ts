import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute';
import ApiClient from 'ch-sdk-node/dist/client';
import { LateFilingPenaltyService } from 'ch-sdk-node/dist/services/lfp';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/PenaltyDetailsController';
import { CompanyNameProcessor } from 'app/controllers/processors/CompanyNameProcessor';
import { PenaltyDetailsValidator } from 'app/controllers/validators/PenaltyDetailsValidator';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { Navigation } from 'app/models/Navigation';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { PenaltyIdentifierSchemaFactory } from 'app/models/PenaltyIdentifierSchemaFactory';
import { AuthMethod } from 'app/modules/Types';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

import { createApp } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

const pageHeading = 'What are the penalty details?';
const errorSummaryHeading = 'There is a problem with the information you entered';

describe('PenaltyDetailsController', () => {

    const navigation = {} as Navigation;

    const companyNumberSchemaFactory = new PenaltyIdentifierSchemaFactory(getEnvOrThrow('ALLOWED_COMPANY_PREFIXES'));

    describe('GET request', () => {

        const appeal = {
            penaltyIdentifier: {
                companyNumber: '00345567',
                userInputPenaltyReference: 'A00000001',
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
                        .and.to.contain(appeal.penaltyIdentifier.userInputPenaltyReference)
                        .and.not.contain(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to disclaimer page when posting valid penalty details', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'SC123123',
                    userInputPenaltyReference: 'A12345678'
                }
            } as Appeal;

            const app = createApp({ appeal }, container => {
                container.rebind(PenaltyDetailsValidator)
                    .toConstantValue(createSubstituteOf<PenaltyDetailsValidator>(config => {
                        config.validate(Arg.any()).resolves(new ValidationResult([]));
                    }));

                container.rebind(CompanyNameProcessor).toConstantValue(
                    createSubstituteOf<CompanyNameProcessor>(config => {
                        config.process(Arg.any()).resolves();
                    }));
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(SELECT_THE_PENALTY_PAGE_URI);
                });

        });

        it('should render error page when company profile is unavailable ', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'SC123123',
                    userInputPenaltyReference: 'A12345678'
                }
            } as Appeal;

            const app = createApp({ appeal }, container => {
                container.rebind(PenaltyDetailsValidator).toConstantValue(createSubstituteOf<PenaltyDetailsValidator>(
                    config => {
                        config.validate(Arg.any()).resolves(new ValidationResult([]));
                    }
                ));
                container.rebind(CompanyNameProcessor).toConstantValue(
                    createSubstituteOf<CompanyNameProcessor>(config => {
                        config.process(Arg.any()).throws(new Error('An error occurred'));
                    })
                );
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(appeal.penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain('Sorry, there is a problem with the service');
                });

        });

        it('should return 400 when posting empty penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '',
                userInputPenaltyReference: '',
                companyNumber: 'SC123123'
            };

            const app = createApp({}, container => {
                container.rebind(PenaltyIdentifierSchemaFactory).toConstantValue(companyNumberSchemaFactory);
            });

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
                userInputPenaltyReference: '0',
                companyNumber: 'SC123123'
            };

            const app = createApp({}, container => {
                container.rebind(PenaltyIdentifierSchemaFactory).toConstantValue(companyNumberSchemaFactory);
            });

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
                userInputPenaltyReference: 'A12345678',
                companyNumber: ''
            };

            const app = createApp({}, container => {
                container.rebind(PenaltyIdentifierSchemaFactory).toConstantValue(companyNumberSchemaFactory);
            });

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
                userInputPenaltyReference: 'A12345678',
                companyNumber: 'AB66666666'
            };

            const app = createApp({}, container => {
                container.rebind(PenaltyIdentifierSchemaFactory).toConstantValue(companyNumberSchemaFactory);
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter your full eight character company number');
                });
        });

        it('should return 400 when late filling penalty service fails', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                userInputPenaltyReference: 'A12345678',
                companyNumber: 'NI123456'
            };

            const app = createApp({}, container => {

                const lateFillingPenaltiesService = createSubstituteOf<LateFilingPenaltyService>(config => {
                    config.getPenalties('NI123456').rejects(new Error('Cannot read property \'map\' of null'));
                });

                const api = createSubstituteOf<ApiClient>(config => {
                    config.lateFilingPenalties.returns!(lateFillingPenaltiesService);
                });

                container.rebind(PenaltyDetailsValidator)
                    .toConstantValue(new PenaltyDetailsValidator((_: AuthMethod) => api,
                        new PenaltyIdentifierSchemaFactory('')));

            });


            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain(PenaltyDetailsValidator.COMPANY_NUMBER_VALIDATION_ERROR.text)
                        .and.to.contain(PenaltyDetailsValidator.PENALTY_REFERENCE_VALIDATION_ERROR.text);
                });

        });
    });
});

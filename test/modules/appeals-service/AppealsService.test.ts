import { expect } from 'chai';
import nock = require('nock');

import { Appeal } from 'app/models/Appeal';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { AppealNotFoundError, AppealServiceError, AppealUnauthorisedError, AppealUnprocessableEntityError } from 'app/modules/appeals-service/errors';

describe('AppealsService', () => {

    const BEARER_TOKEN: string = '123';
    const HOST: string = 'http://localhost:9000';
    const APPEALS_URI: string = '/companies/00345567/appeals';
    const APPEAL_ID: string = '123';
    const appealsService = new AppealsService(HOST);

    const appeal: Appeal = {
        penaltyIdentifier: {
            companyNumber: '00345567',
            penaltyReference: 'A00000001',
        },
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'they are legit',
                attachments: []
            }
        }
    };

    describe('saving appeals', () => {

        it('should throw an error when appeal not defined', () => {

            [undefined, null].forEach(async appealData => {
                try {
                    await appealsService.save(appealData as any, BEARER_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal is missing');
                }
            });
        });

        it('should throw an error when BEARER_TOKEN not defined', () => {

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.save(appeal as Appeal, invalidToken as any);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing');
                }
            });
        });

        it('should save appeal and return location header', async () => {

            const appealId: string = '555';
            const RESOURCE_LOCATION: string = `/companies/00345567/appeals/${appealId}`;

            nock(HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(201, appealId, { 'location': RESOURCE_LOCATION });

            await appealsService.save(appeal, BEARER_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(appealId);
                });
        });


        it('should return status 401 when auth header is invalid', async () => {

            nock(HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer 1'
                        },
                    }
                )
                .reply(401);


            try {
                await appealsService.save(appeal as Appeal, '1');
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnauthorisedError.name);
                expect(err.message).to.contain(`save appeal unauthorised`);
            }
        });

        it('should return status 422 when invalid appeal data', async () => {

            const invalidAppeal = {
                'penaltyIdentifier': {
                    'companyNumber': '00345567',
                    'penaltyReference': 'A00000001'
                }
            };

            nock(HOST)
                .post(APPEALS_URI,
                    invalidAppeal,
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(422);

            try {
                await appealsService.save(invalidAppeal as Appeal, BEARER_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnprocessableEntityError.name);
                expect(err.message).to.contain(`save appeal on invalid appeal data`);
            }
        });

        it('should return status 500 when internal server error', async () => {

            nock(HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(500);

            try {
                await appealsService.save(appeal as Appeal, BEARER_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`save appeal failed with message`);
            }
        });
    });

    describe('Loading appeals', () => {
        it('should throw an error when arguments are not defined', () => {

            const testAppealId = '123';
            const testCompanyNumber = 'NI000000';

            [undefined, null].forEach(async companyNumber => {
                try {
                    await appealsService.getAppeal(companyNumber!, testAppealId, BEARER_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Company number is missing');
                }
            });

            [undefined, null].forEach(async appealId => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, appealId!, BEARER_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal id is missing');
                }
            });

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, testAppealId, invalidToken!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing');
                }
            });

        });

        it('should return an appeal when valid arguments are provided', async () => {

            nock(HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(200, appeal);

            const returnedAppeal = await appealsService
                .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN);

            expect(returnedAppeal).to.deep.eq(appeal);

        });

        it('should return an AppealNotFoundError when response status is 404', async () => {

            nock(HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(404);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealNotFoundError.name);
                expect(err.message).to.contain(`get appeal failed because appeal ${APPEAL_ID} was not found`);

            }

        });

        it('should return an AppealServiceError when response status is 500 ', async () => {


            nock(HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(500);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`get appeal failed on appeal ${APPEAL_ID} with message`);

            }

        });
    });
});

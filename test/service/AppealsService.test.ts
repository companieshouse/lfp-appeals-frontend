import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import nock = require('nock');

import { Appeal } from 'app/models/Appeal';
import { AppealsService } from 'app/service/AppealsService';

describe('AppealsService', () => {

    const BEARER_TOKEN: string = '123';
    const HOST: string = 'http://localhost:9000';
    const APPEALS_URI: string = '/companies/00345567/appeals';
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

            const RESOURCE_LOCATION: string = '/companies/00345567/appeals/555';

            nock(HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(201, {}, { 'location': RESOURCE_LOCATION });

            await appealsService.save(appeal, BEARER_TOKEN)
                .then((response) => {
                    expect(response).to.equal(RESOURCE_LOCATION);
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
                .replyWithError({ code: 401 });


            try {
                await appealsService.save(appeal as Appeal, '1');
            } catch (err) {
                expect(err.code).to.be.equal(UNAUTHORIZED);
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
                .replyWithError({
                    message: { 'reason': 'reasons must not be null' },
                    code: 422,
                });

            try {
                await appealsService.save(invalidAppeal as Appeal, BEARER_TOKEN);
            } catch (err) {
                expect(err.code).to.be.equal(UNPROCESSABLE_ENTITY);
                expect(err.message).to.contain({ 'reason': 'reasons must not be null' });
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
                .replyWithError({
                    code: 500
                });

            try {
                await appealsService.save(appeal as Appeal, BEARER_TOKEN);
            } catch (err) {
                expect(err.code).to.be.equal(INTERNAL_SERVER_ERROR);
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


            const validAppealId = '123';

            nock(HOST)
                .get(APPEALS_URI, validAppealId)
                .reply(200, appeal);

            const returnedAppeal = await appealsService
                .getAppeal(appeal.penaltyIdentifier.companyNumber, validAppealId, BEARER_TOKEN);

            expect(returnedAppeal).to.deep.eq(appeal);

        });
    });
});

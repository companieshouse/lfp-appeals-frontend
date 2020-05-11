import { assert, expect } from 'chai';
import nock = require('nock');

import { REFRESH_TOKEN_GRANT_TYPE } from 'app/Constants';
import { Appeal } from 'app/models/Appeal';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { AppealNotFoundError, AppealServiceError,
    AppealUnprocessableEntityError } from 'app/modules/appeals-service/errors';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import { RefreshTokenService } from 'app/modules/refresh-token-service/RefreshTokenService';

describe('AppealsService', () => {
    const appealId: string = '555';
    const RESOURCE_LOCATION: string = `/companies/00345567/appeals/${appealId}`;
    const CLIENT_ID: string = '1';
    const CLIENT_SECRET: string = 'ABC';
    const REFRESH_TOKEN: string = '12345';
    const REFRESH_URI: string = '/oauth2/token';
    const REFRESH_PARAMS: string = `?grant_type=${REFRESH_TOKEN_GRANT_TYPE}&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const REFRESH_HOST: string = 'http://localhost:4000';

    const refreshTokenData: RefreshTokenData = {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'access_token': 'AycNLq8ZZoeblglCUtdZUuoui9hhKn0t2rK3PxprD4fHMS21iLDb_lQf9mnkPIK5OYcGzv_I2b6RjgK2QGbWAg'
    };
    const refreshTokenService = new RefreshTokenService(REFRESH_HOST + REFRESH_URI, CLIENT_ID, CLIENT_SECRET);

    const BEARER_TOKEN: string = '123';
    const APPEALS_HOST: string = 'http://localhost:9000';
    const APPEALS_URI: string = '/companies/00345567/appeals';
    const APPEAL_ID: string = '123';
    const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

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
                    await appealsService.save(appealData as any, BEARER_TOKEN, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal is missing');
                }
            });
        });

        it('should throw an error when BEARER_TOKEN not defined', () => {

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.save(appeal as Appeal, invalidToken as any, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing');
                }
            });
        });

        it('should save appeal and return location header', async () => {
            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(201, appealId, { 'location': RESOURCE_LOCATION });

            await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(appealId);
                });
        });

        it('should save appeal and return location header after refreshing access token', async() => {
            nock(APPEALS_HOST)
                .post(APPEALS_URI)
                .reply(401);

            const refreshMock = nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(200, refreshTokenData);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + refreshTokenData.access_token,
                        },
                    }
                )
                .reply(201, appealId, { 'location': RESOURCE_LOCATION });

            await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(appealId);
                    expect(refreshMock.isDone()).to.equal(true);
                });
        });

        it('should throw an error if resource could not be created', async () => {
            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(201);

            try {
                await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN);
                assert.fail();
            } catch (err) {
                expect(err.message).to.contain('Could not create appeal resource');
            }
        });

        it('should return status 401 when auth header is invalid', async () => {

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            authorization: 'Bearer 1'
                        },
                    }
                )
                .reply(401);

            nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(401);

            try {
                await appealsService.save(appeal as Appeal, '1', REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealServiceError.name);
            }
        });

        it('should return status 422 when invalid appeal data', async () => {

            const invalidAppeal = {
                'penaltyIdentifier': {
                    'companyNumber': '00345567',
                    'penaltyReference': 'A00000001'
                }
            };

            nock(APPEALS_HOST)
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
                await appealsService.save(invalidAppeal as Appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnprocessableEntityError.name);
                expect(err.message).to.contain(`save appeal on invalid appeal data`);
            }
        });

        it('should return status 500 when internal server error', async () => {

            nock(APPEALS_HOST)
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
                await appealsService.save(appeal as Appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`save appeal failed with message`);
            }
        });
    });

    describe('Loading appeals', () => {
        it('should throw an error when arguments are not defined', () => {

            const testCompanyNumber = 'NI000000';

            [undefined, null].forEach(async companyNumber => {
                try {
                    await appealsService.getAppeal(companyNumber!, appealId, BEARER_TOKEN, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Company number is missing');
                }
            });

            [undefined, null].forEach(async testAppealId => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, testAppealId!, BEARER_TOKEN, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal id is missing');
                }
            });

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, appealId, invalidToken!, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Access token is missing');
                }
            });

            [undefined, null].forEach(async refreshToken => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, appealId, BEARER_TOKEN, refreshToken!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Refresh token is missing');
                }
            });

        });

        it('should return an appeal when valid arguments are provided', async () => {

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(200, appeal);

            const returnedAppeal = await appealsService
                .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);

            expect(returnedAppeal).to.deep.eq(appeal);

        });

        it('should return an appeal when valid arguments are provided after refreshing an expired access token',
            async () => {

                nock(APPEALS_HOST)
                    .get(`${APPEALS_URI}/${APPEAL_ID}`)
                    .reply(401);

                const refreshMock = nock(REFRESH_HOST)
                    .post(REFRESH_URI + REFRESH_PARAMS)
                    .reply(200, refreshTokenData);

                nock(APPEALS_HOST)
                    .get(`${APPEALS_URI}/${APPEAL_ID}`)
                    .reply(200, appeal);

                const returnedAppeal = await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);

                expect(returnedAppeal).to.deep.eq(appeal);
                expect(refreshMock.isDone()).to.equal(true);

            });

        it('should return status 401 when auth header is invalid', async () => {

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`, {},
                    {
                        reqheaders: {
                            Authorization: 'Bearer 1'
                        },
                    })
                .reply(401);

            nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(401);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, '1', REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealServiceError.name);
            }

        });

        it('should return an AppealNotFoundError when response status is 404', async () => {

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(404);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealNotFoundError.name);
                expect(err.message).to.contain(`get appeal failed because appeal ${APPEAL_ID} was not found`);

            }

        });

        it('should return an AppealServiceError when response status is 500 ', async () => {


            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`)
                .reply(500);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`get appeal failed on appeal ${APPEAL_ID} with message`);

            }
        });
    });
});

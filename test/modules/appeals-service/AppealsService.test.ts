import {Arg} from '@fluffy-spoon/substitute';
import { assert, expect } from 'chai';
import { CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import nock = require('nock');

import { REFRESH_TOKEN_GRANT_TYPE } from 'app/Constants';
import { Appeal } from 'app/models/Appeal';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import {
    AppealNotFoundError,
    AppealServiceError, AppealUnauthorisedError,
    AppealUnprocessableEntityError
} from 'app/modules/appeals-service/errors';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import { RefreshTokenService } from 'app/modules/refresh-token-service/RefreshTokenService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('AppealsService', () => {
    const APPEAL_ID: string = '555';
    const RESOURCE_LOCATION: string = `/companies/00345567/appeals/${APPEAL_ID}`;

    const refreshTokenData: RefreshTokenData = {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'access_token': '123XYZ'
    };

    const BEARER_TOKEN: string = '123';
    const REFRESH_TOKEN: string = 'XYZ';

    const REFRESH_CLIENT_ID: string = '1';
    const REFRESH_CLIENT_SECRET: string = 'ABC';
    const REFRESH_PARAMS: string = `?grant_type=${REFRESH_TOKEN_GRANT_TYPE}&refresh_token=${REFRESH_TOKEN}` +
        `&client_id=${REFRESH_CLIENT_ID}&client_secret=${REFRESH_CLIENT_SECRET}`;
    const REFRESH_HOST: string = 'http://localhost:4000';
    const REFRESH_URI: string = '/oauth2/token';

    const APPEALS_HOST: string = 'http://localhost:9000';
    const APPEALS_URI: string = '/companies/00345567/appeals';

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

            const appealsService = new AppealsService(APPEALS_URI, createSubstituteOf<RefreshTokenService>());

            [undefined, null].forEach(async appealData => {
                try {
                    await appealsService.save(appealData as any, BEARER_TOKEN, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal data is missing');
                }
            });
        });

        it('should throw an error when BEARER_TOKEN not defined', () => {

            const appealsService = new AppealsService(APPEALS_URI, createSubstituteOf<RefreshTokenService>());

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.save(appeal, invalidToken as any, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Access token is missing');
                }
            });
        });

        it('should throw an error when REFRESH_TOKEN not defined', () => {

            const appealsService = new AppealsService(APPEALS_URI, createSubstituteOf<RefreshTokenService>());

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealsService.save(appeal, BEARER_TOKEN, invalidToken as any);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Refresh token is missing');
                }
            });
        });

        it('should save appeal and return location header', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(CREATED, APPEAL_ID, {'location': RESOURCE_LOCATION});

            await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(APPEAL_ID);
                });
            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });

        it('should save appeal and return location header when token has expired', async () => {

            const refreshTokenService =
                new RefreshTokenService(REFRESH_HOST + REFRESH_URI, REFRESH_CLIENT_ID, REFRESH_CLIENT_SECRET);
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(UNAUTHORIZED);

            const refreshMock = nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(OK, refreshTokenData);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + refreshTokenData.access_token,
                        },
                    }
                )
                .reply(CREATED, APPEAL_ID, {'location': RESOURCE_LOCATION});

            await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(APPEAL_ID);
                    expect(refreshMock.isDone()).to.equal(true);
                });
        });

        it('should throw an error when status 201 is returned with no data', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(CREATED);

            try {
                await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN);
                assert.fail();
            } catch (err) {
                expect(err.message).to.contain('Could not create appeal resource');
            }

            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });

        it('should return status 401 when expired token refresh fails with 401', async () => {

            const refreshTokenService =
                new RefreshTokenService(REFRESH_HOST + REFRESH_URI, REFRESH_CLIENT_ID, REFRESH_CLIENT_SECRET);
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    }
                )
                .reply(UNAUTHORIZED);

            nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(UNAUTHORIZED);

            try {
                await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnauthorisedError.name);
                expect(err.message).to.contain('save appeal unauthorised');
            }
        });

        it('should return status 401 when auth header is invalid second time around', async () => {

            const refreshTokenService =
                new RefreshTokenService(REFRESH_HOST + REFRESH_URI, REFRESH_CLIENT_ID, REFRESH_CLIENT_SECRET);
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    }
                )
                .reply(UNAUTHORIZED);

            nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(OK, refreshTokenData);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + refreshTokenData.access_token
                        },
                    }
                )
                .reply(UNAUTHORIZED);

            try {
                await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnauthorisedError.name);
                expect(err.message).to.contain('save appeal unauthorised');
            }
        });

        it('should return status 422 when invalid appeal data', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

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
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    }
                )
                .reply(UNPROCESSABLE_ENTITY);

            try {
                await appealsService.save(invalidAppeal as Appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnprocessableEntityError.name);
                expect(err.message).to.contain(`save appeal on invalid appeal data`);
            }

            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });

        it('should return status 500 when internal server error', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .post(APPEALS_URI,
                    JSON.stringify(appeal),
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    }
                )
                .reply(INTERNAL_SERVER_ERROR);

            try {
                await appealsService.save(appeal, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`save appeal failed with message`);
            }

            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });
    });

    describe('Loading appeals', () => {
        it('should throw an error when arguments are not defined', () => {

            const appealsService = new AppealsService(APPEALS_URI, createSubstituteOf<RefreshTokenService>());

            const testCompanyNumber = 'NI000000';

            [undefined, null].forEach(async companyNumber => {
                try {
                    await appealsService.getAppeal(companyNumber!, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
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
                    await appealsService.getAppeal(testCompanyNumber, APPEAL_ID, invalidToken!, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Access token is missing');
                }
            });

            [undefined, null].forEach(async refreshToken => {
                try {
                    await appealsService.getAppeal(testCompanyNumber, APPEAL_ID, BEARER_TOKEN, refreshToken!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Refresh token is missing');
                }
            });

        });

        it('should return an appeal when valid arguments are provided', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`, {}, {
                    reqheaders: {
                        Accept: 'application/json',
                        Authorization: 'Bearer ' + BEARER_TOKEN
                    }
                })
                .reply(OK, appeal);

            const returnedAppeal = await appealsService
                .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);

            expect(returnedAppeal).to.deep.eq(appeal);

            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });

        it('should return an appeal when valid arguments are provided after refreshing an expired access token',
            async () => {

                const refreshTokenService =
                    new RefreshTokenService(REFRESH_HOST + REFRESH_URI, REFRESH_CLIENT_ID, REFRESH_CLIENT_SECRET);
                const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

                nock(APPEALS_HOST)
                    .get(`${APPEALS_URI}/${APPEAL_ID}`, {}, {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        }
                    })
                    .reply(UNAUTHORIZED);

                const refreshMock = nock(REFRESH_HOST)
                    .post(REFRESH_URI + REFRESH_PARAMS)
                    .reply(OK, refreshTokenData);

                nock(APPEALS_HOST)
                    .get(`${APPEALS_URI}/${APPEAL_ID}`, {}, {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + refreshTokenData.access_token,
                        }
                    })
                    .reply(OK, appeal);

                const returnedAppeal = await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);

                expect(returnedAppeal).to.deep.eq(appeal);
                expect(refreshMock.isDone()).to.equal(true);

            });

        it('should return status 401 on GET when auth header is invalid after refresh token', async () => {

            const refreshTokenService =
                new RefreshTokenService(REFRESH_HOST + REFRESH_URI, REFRESH_CLIENT_ID, REFRESH_CLIENT_SECRET);
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`, {},
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    })
                .reply(UNAUTHORIZED);

            nock(REFRESH_HOST)
                .post(REFRESH_URI + REFRESH_PARAMS)
                .reply(UNAUTHORIZED);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).to.be.equal(AppealUnauthorisedError.name);
                expect(err.message).to.contain(`get appeal unauthorised`);
            }
        });

        it('should return an AppealNotFoundError when response status is 404', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`, {},
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    })
                .reply(NOT_FOUND);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealNotFoundError.name);
                expect(err.message).to.contain(`get appeal failed because appeal ${APPEAL_ID} was not found`);
            }

            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });

        it('should return an AppealServiceError when response status is 500 ', async () => {

            const refreshTokenService = createSubstituteOf<RefreshTokenService>();
            const appealsService = new AppealsService(APPEALS_HOST, refreshTokenService);

            nock(APPEALS_HOST)
                .get(`${APPEALS_URI}/${APPEAL_ID}`, {},
                    {
                        reqheaders: {
                            Accept: 'application/json',
                            Authorization: 'Bearer ' + BEARER_TOKEN
                        },
                    })
                .reply(INTERNAL_SERVER_ERROR);

            try {
                await appealsService
                    .getAppeal(appeal.penaltyIdentifier.companyNumber, APPEAL_ID, BEARER_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err.constructor.name).eq(AppealServiceError.name);
                expect(err.message).to.include(`get appeal failed on appeal ${APPEAL_ID} with message`);
            }
            refreshTokenService.didNotReceive().refresh(Arg.any(), Arg.any());
        });
    });
});

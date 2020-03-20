import { AxiosResponse } from 'axios';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import nock = require('nock');

import { Appeal } from 'app/models/Appeal';
import { AppealStorageService } from 'app/service/AppealStorageService'

const appealData: Appeal = {
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
};

describe('AppealStorageService', () => {

    describe('saving appeals', () => {

        it('should throw an error when appeal not defined', () => {
            const appealStorageService = new AppealStorageService('/companies/1/appeals');

            [undefined, null].forEach(async appeal => {
                try {
                    await appealStorageService.save(appeal as any, '123')
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal is missing')
                }
            })
        });

        it('should throw an error when token not defined', () => {
            const appealStorageService = new AppealStorageService('/companies/1/appeals');

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealStorageService.save(appealData, invalidToken as any)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing')
                }
            })
        });

        it('should save appeal and return location header', async () => {

            const appealStorageService = new AppealStorageService('http://localhost:9000');

            nock('http://localhost:9000')
                .post('/companies/00345567/appeals', {
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
                    }, {
                        reqheaders: {
                            authorization: 'Bearer 123',
                        },
                    }
                )
                .reply(201, {}, {'location': '/companies/00345567/appeals/555'});

            await appealStorageService.save(appealData, '123')
                .then((response: AxiosResponse) => {
                    expect(response).to.equal('/companies/00345567/appeals/555');
                })
        });


        it('should return status 401 when auth header is invalid', async () => {

            const appealStorageService = new AppealStorageService('http://localhost:9000');

            nock('http://localhost:9000')
                .post('/companies/00345567/appeals', {
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
                    }, {
                        reqheaders: {
                            authorization: 'Bearer 1'
                        },
                    }
                )
                .replyWithError({code: 401});


            try {
                await appealStorageService.save(appealData, '1')
            } catch (err) {
                expect(err.code).to.be.equal(UNAUTHORIZED);
            }
        });

        it('should return status 422 when invalid appeal data', async () => {

            const appealStorageService = new AppealStorageService('http://localhost:9000');

            nock('http://localhost:9000')
                .post('/companies/00345567/appeals', {
                        'penaltyIdentifier': {
                            'companyNumber': '00345567',
                            'penaltyReference': 'A00000001'
                        }
                    },
                    {
                        reqheaders: {
                            authorization: 'Bearer 123',
                        },
                    }
                )
                .replyWithError({
                    message: {'reason': 'reasons must not be null'},
                    code: 422,
                });

            try {
                await appealStorageService.save({
                    'penaltyIdentifier': {
                        'companyNumber': '00345567',
                        'penaltyReference': 'A00000001'
                    }
                } as Appeal, '123')
            } catch (err) {
                expect(err.code).to.be.equal(UNPROCESSABLE_ENTITY);
                expect(err.message).to.contain({'reason': 'reasons must not be null'});
            }
        })

        it('should return status 500 when internal server error', async () => {

            const appealStorageService = new AppealStorageService('http://localhost:9000');

            nock('http://localhost:9000')
                .post('/companies/00345567/appeals', {
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
                    },
                    {
                        reqheaders: {
                            authorization: 'Bearer 123',
                        },
                    }
                )
                .replyWithError({
                    code: 500
                });

            try {
                await appealStorageService.save(appealData, '123')
            } catch (err) {
                expect(err.code).to.be.equal(INTERNAL_SERVER_ERROR);
            }
        })
    })
})

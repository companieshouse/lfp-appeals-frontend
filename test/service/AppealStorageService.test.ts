import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import nock = require('nock');

import { Appeal} from 'app/models/Appeal';
import { AppealStorageService } from 'app/service/AppealStorageService'

describe('AppealStorageService', () => {

    const BEARER_TOKEN: string = '123';
    const HOST: string = 'http://localhost:9000';
    const APPEALS_URI: string = '/companies/00345567/appeals';
    const appealStorageService = new AppealStorageService(HOST);

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
    };

    describe('saving appeals', () => {

        it('should throw an error when appeal not defined', () => {

            [undefined, null].forEach(async appealData => {
                try {
                    await appealStorageService.save(appealData as any, BEARER_TOKEN)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Appeal is missing')
                }
            })
        });

        it('should throw an error when BEARER_TOKEN not defined', () => {

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealStorageService.save(appeal as Appeal, invalidToken as any)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing')
                }
            })
        });

        it('should save appeal and return location header', async () => {

            const RESOURCE_LOCATION: string = '/companies/00345567/appeals/555';

            nock(HOST)
                .post(APPEALS_URI,
                    appeal,
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
                        },
                    }
                )
                .reply(201, {}, {'location': RESOURCE_LOCATION});

            await appealStorageService.save(appeal as Appeal, BEARER_TOKEN)
                .then((response) => {
                    expect(response).to.equal(RESOURCE_LOCATION);
                })
        });


        it('should return status 401 when auth header is invalid', async () => {

            nock(HOST)
                .post(APPEALS_URI,
                    appeal,
                    {
                        reqheaders: {
                            authorization: 'Bearer 1'
                        },
                    }
                )
                .replyWithError({code: 401});


            try {
                await appealStorageService.save(appeal as Appeal, '1')
            } catch (err) {
                expect(err.code).to.be.equal(UNAUTHORIZED);
            }
        });

        it('should return status 422 when invalid appeal data', async () => {

            nock(HOST)
                .post(APPEALS_URI, {
                        'penaltyIdentifier': {
                            'companyNumber': '00345567',
                            'penaltyReference': 'A00000001'
                        }
                    },
                    {
                        reqheaders: {
                            authorization: 'Bearer ' + BEARER_TOKEN,
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
                } as Appeal, BEARER_TOKEN)
            } catch (err) {
                expect(err.code).to.be.equal(UNPROCESSABLE_ENTITY);
                expect(err.message).to.contain({'reason': 'reasons must not be null'});
            }
        });

        it('should return status 500 when internal server error', async () => {

            nock(HOST)
                .post(APPEALS_URI,
                    appeal,
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
                await appealStorageService.save(appeal as Appeal, BEARER_TOKEN)
            } catch (err) {
                expect(err.code).to.be.equal(INTERNAL_SERVER_ERROR);
            }
        })
    })
});

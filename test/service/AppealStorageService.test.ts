import { AxiosResponse } from 'axios';
import { expect } from 'chai';
import { CREATED } from 'http-status-codes';
import nock = require('nock');

import { Appeal } from 'app/models/Appeal';
import { AppealStorageService } from 'app/service/AppealStorageService'

const appeal: Appeal = {
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
                    await appealStorageService.save(appeal, invalidToken as any)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing')
                }
            })
        });

        it('should save appeal and status 201 with location header', async () => {

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

            await appealStorageService.save(appeal, '123')
                .then((response: AxiosResponse) => {
                    expect(response.status).to.be.equal(CREATED);
                    expect(response.headers).to.contain({'content-type': 'application/json'})
                    expect(response.headers).to.contain({'location': '/companies/00345567/appeals/555'});
                })
        });
    })
})

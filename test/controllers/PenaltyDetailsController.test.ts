import 'reflect-metadata'
import { createApplication } from '../ApplicationFactory';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/PenaltyDetailsController';
import { RedisService } from '../../src/services/RedisService';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { expect } from 'chai';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';

const app = createApplication(container => {
    container
        .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => { service }));
});


describe('PenaltyDetailsController', () => {
    describe('GET request', () => {

        it('should return 200 when trying to access the penalty-reference page without a session', async () => {
            await request(app).get('/penalty-reference')
                .expect(resonse => {
                    expect(resonse.status).to.be.equal(OK)
                })
        });


        it('should return 200 when trying to access the penalty-reference page with a session', async () => {

            const penaltyDetails: Record<string, any> = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            const app = createApplication(container => {
                container
                    .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                        service.getObject('1').returns(Promise.resolve(penaltyDetails))
                    }));
            });
            await request(app).get('/penalty-reference')
                .set('Cookie', ['penalty-cookie=1'])
                .expect(response => {
                    expect(response.status).to.be.equal(OK)
                    expect(response.text).to.contain(penaltyDetails.companyNumber)
                    expect(response.text).to.contain(penaltyDetails.penaltyReference)
                })
        });
    });

    describe('POST request', () => {
        it('should return 302 when posting valid penalty details', async () => {

            const penaltyDetails: PenaltyReferenceDetails = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            const app = createApplication(container => {
                container
                    .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                        service.setObject('1', penaltyDetails).returns(Promise.resolve('{}'))
                    }));
            });

            await request(app).post('/penalty-reference')
                .send(penaltyDetails)
                .expect(response => {
                    expect(response.get('Set-Cookie')).to.contain('penalty-cookie=1; Path=/')
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY)
                });

        });

        it('should return 400 when posting empty penalty reference', async () => {

            const penaltyDetails: PenaltyReferenceDetails = {
                penaltyReference: '',
                companyNumber: 'SC123123'
            };
            await request(app).post('/penalty-reference')
                .send(penaltyDetails)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('You must enter a penalty reference number');
                });

        });

        it('should return 400 when posting invalid penalty reference', async () => {

            const penaltyDetails: PenaltyReferenceDetails = {
                penaltyReference: '12345678',
                companyNumber: 'SC123123'
            };
            await request(app).post('/penalty-reference')
                .send(penaltyDetails)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('You must enter your reference number exactly as shown on your penalty notice');
                });

        });

        it('should return 400 when posting empty company number', async () => {

            const penaltyDetails: PenaltyReferenceDetails = {
                penaltyReference: 'A12345678',
                companyNumber: ''
            };
            await request(app).post('/penalty-reference')
                .send(penaltyDetails)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('You must enter a company number');
                });
        });

        it('should return 400 when posting invalid company number', async () => {

            const penaltyDetails: PenaltyReferenceDetails = {
                penaltyReference: 'A12345678',
                companyNumber: 'AB66666666'
            };
            await request(app).post('/penalty-reference')
                .send(penaltyDetails)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('You must enter your full eight character company number');
                });
        });
    });
});
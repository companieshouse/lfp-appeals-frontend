import 'reflect-metadata'
import { Application } from 'express'
import { createApplication } from '../ApplicationFactory';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/PenaltyDetailsController';
import { RedisService } from '../../src/services/RedisService';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';

describe('PenaltyDetailsController', () => {

    it('should return 200 when trying to access the penalty-reference page', async () => {
        const app = createApplication(container => {

            container
                .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                    service.ping().returns(true)
                }))
        });
        await request(app).get('/penalty-reference').expect(200);
    });

    it('should return 200 when posting valid penalty detals', async () => {

        const app = createApplication(container => {
            container
                .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                    service.ping().returns(true)
                }))
        });

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'A12345678',
            companyNumber: 'SC123123'
        };
        await request(app).post('/penalty-reference').send(penaltyDetails).expect(200);
    });


})
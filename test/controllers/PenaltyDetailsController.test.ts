import 'reflect-metadata'
import { createApplication } from '../ApplicationFactory';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/PenaltyDetailsController';
import { RedisService } from '../../src/services/RedisService';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';

const app = createApplication(container => {
    container
        .bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
            service.ping().returns(true)
        }));
});

describe('PenaltyDetailsController', () => {

    it('should return 200 when trying to access the penalty-reference page', async () => {
        await request(app)
            .get('/penalty-reference')
            .expect(OK);
    });

    // it('should return 200 when posting valid penalty details', async () => {
    //     const penaltyDetails: PenaltyReferenceDetails = {
    //         penaltyReference: 'A12345678',
    //         companyNumber: 'SC123123'
    //     };
    //     await request(app)
    //         .post('/penalty-reference')
    //         .send(penaltyDetails)
    //         .expect(OK);
    // });

    it('should return 400 when posting empty penalty reference', async () => {
        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '',
            companyNumber: 'SC123123'
        };
        await request(app)
            .post('/penalty-reference')
            .send(penaltyDetails)
            .expect(BAD_REQUEST);
    });

})
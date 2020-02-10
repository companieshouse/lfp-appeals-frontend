
import 'reflect-metadata'
import { createApplication } from '../ApplicationFactory';
import { PENALTY_DETAILS_PAGE_URL } from '../../src/utils/Paths';
import * as request from 'supertest'
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';

describe('PenaltyDetailsController', () => {
    it('should return 200 when trying to access the penalty-reference page', async () => {
        const app = createApplication(container => {
            container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                service.ping().returns(true)
            }));
        });
        await request(app).get(PENALTY_DETAILS_PAGE_URL).expect(200);
    });
})
import 'reflect-metadata'
import '../../src/controllers/OtherReasonDisclaimerController'
import { createApplication } from '../ApplicationFactory';
import { OTHER_REASON_DISCLAIMER_PAGE_URI } from '../../src/utils/Paths';
import * as request from 'supertest'
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';

describe('OtherReasonDisclaimerController', () => {
    it('should return 200 when trying to access the other-reason-entry page', async () => {
        const app = createApplication(container => {
            container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                service.ping().returns(true)
            }));
        });
        await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(200);
    });
});

import 'reflect-metadata'
import '../../src/controllers/OtherReasonController'
import { createApplication } from '../ApplicationFactory';
import { OTHER_REASON_PAGE_URL } from '../../src/utils/Paths';
import * as request from 'supertest'
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';

describe('OtherReasonController', () => {
    it('should return 200 when trying to access the other-reason-entry page', async () => {
        const app = createApplication(container => {
            container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                service.ping().returns(true)
            }));
        });
        await request(app).get(OTHER_REASON_PAGE_URL).expect(200);
    });
});

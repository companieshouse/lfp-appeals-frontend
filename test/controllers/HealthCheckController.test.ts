import 'reflect-metadata'
import { Application } from 'express'
import * as request from 'supertest'
import { createApplication } from '../ApplicationFactory';
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/HealthCheckController'
import { RedisService } from '../../src/services/RedisService';
import { HEALTH_CHECK_URI } from '../../src/utils/Paths';

describe('HealthCheckController', () => {
    it('should return 200 with status when redis database is up', async () => {
        const app = createApplication(container => {
            container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                service.ping().returns(true)
            }));
        });

        await makeHealthCheckRequest(app).expect(200, 'Redis healthy: true');
    });

    it('should return 500 with status when redis database is down', async () => {
        const app = createApplication(container => {
            container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                service.ping().returns(false)
            }))
        });

        await makeHealthCheckRequest(app).expect(500, 'Redis healthy: false');
    });

    function makeHealthCheckRequest(app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

import 'reflect-metadata'
import { Application } from 'express'
import * as request from 'supertest'
import { createAppConfigurable } from '../ApplicationFactory';
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/HealthCheckController'
import { Redis } from 'ioredis';
import { SessionStore } from 'ch-node-session-handler';
import { HEALTH_CHECK_URI } from '../../src/utils/Paths';
import { EmailService } from '../../src/modules/email-publisher/EmailService'

describe('HealthCheckController', () => {
    it('should return 200 with status when redis database is up', async () => {
        const app = createAppConfigurable(container => {
            const redis = createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.resolve('OK'))
            });
            container.bind(SessionStore).toConstantValue(new SessionStore(redis));
            container.bind(EmailService).toConstantValue(createSubstituteOf<EmailService>())
        });

        await makeHealthCheckRequest(app).expect(200, 'Redis status: 200');
    });

    it('should return 500 with status when redis database is down', async () => {
        const app = createAppConfigurable(container => {
            const redis = createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.reject('ERROR'))
            });
            container.bind(SessionStore).toConstantValue(new SessionStore(redis));
            container.bind(EmailService).toConstantValue(createSubstituteOf<EmailService>())
        });

        await makeHealthCheckRequest(app).expect(500, 'Redis status: 500');
    });

    function makeHealthCheckRequest(app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

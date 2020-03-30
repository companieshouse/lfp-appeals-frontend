import 'reflect-metadata'

import { SessionStore } from 'ch-node-session-handler';
import { Application } from 'express'
import { Redis } from 'ioredis';
import request from 'supertest'

import 'app/controllers/HealthCheckController'
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { HEALTH_CHECK_URI } from 'app/utils/Paths';

import { createAppConfigurable } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

describe('HealthCheckController', () => {
    it('should return 200 with status when redis database is up', async () => {
        const app = createAppConfigurable(container => {
            container.bind(SessionStore).toConstantValue(new SessionStore(createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.resolve('OK'))
            })));
            container.bind(EmailService).toConstantValue(createSubstituteOf<EmailService>())
        });

        await makeHealthCheckRequest(app).expect(200, 'Redis status: 200');
    });

    it('should return 500 with status when redis database is down', async () => {
        const app = createAppConfigurable(container => {
            container.bind(SessionStore).toConstantValue(new SessionStore(createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.reject('ERROR'))
            })));
            container.bind(EmailService).toConstantValue(createSubstituteOf<EmailService>())
        });

        await makeHealthCheckRequest(app).expect(500, 'Redis status: 500');
    });

    function makeHealthCheckRequest(app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

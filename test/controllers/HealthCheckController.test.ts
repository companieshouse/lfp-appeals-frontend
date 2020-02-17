import 'reflect-metadata';
import '../global';
import { Application } from 'express';
import * as request from 'supertest';
import { createApplication } from '../ApplicationFactory';
import '../../src/controllers/HealthCheckController';
import { HEALTH_CHECK_URI } from '../../src/utils/Paths';
import { SessionStore } from 'ch-node-session';
import { Redis } from 'ioredis';
import { buildProviderModule } from 'inversify-binding-decorators';


describe('HealthCheckController', () => {
    it('should return 200 with status when redis database is up', async () => {
        const app = createApplication(container => {

            const redis = {
                ping: () => Promise.resolve('OK')
            } as Redis;

            container.bind(SessionStore).toConstantValue(new SessionStore(redis));

        });

        await makeHealthCheckRequest(app).expect(200);
    });

    it('should return 500 with status when redis database is down', async () => {
        const app = createApplication(container => {
            const redis = {
                ping: async () => new Promise((res, rej) => {
                    throw Error();
                })

            } as Redis;
            container.bind(SessionStore).toConstantValue(new SessionStore(redis));
        });

        await makeHealthCheckRequest(app).expect(500);
    });

    function makeHealthCheckRequest(app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

import 'reflect-metadata'
import '../../src/controllers/OtherReasonDisclaimerController'
import { createApplication } from '../ApplicationFactory';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import * as request from 'supertest'
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';
import { expect } from 'chai';
import { OK, MOVED_TEMPORARILY } from 'http-status-codes';

describe('OtherReasonDisclaimerController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access the other-reason-entry page', async () => {
            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>());
            });
            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(OK);
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to reason-other page', async () => {
            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>());
            });
            await request(app).post(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect('Location', OTHER_REASON_PAGE_URI);
                })
        });
    });
});

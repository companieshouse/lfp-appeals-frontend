import 'reflect-metadata'
import '../../src/controllers/EntryController'
import { createApplication } from '../ApplicationFactory';
import * as request from 'supertest'
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';
import { MOVED_TEMPORARILY  } from 'http-status-codes';
import { ENTRY_PREFIX} from '../../src/utils/Paths';

describe('EntryController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access the entry page', async () => {
            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>());
            });
            await request(app).get(ENTRY_PREFIX).expect(MOVED_TEMPORARILY);
        });
    });
});
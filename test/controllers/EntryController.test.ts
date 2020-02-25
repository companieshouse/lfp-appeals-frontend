import 'reflect-metadata'
import '../../src/controllers/EntryController'
import { createApplication } from '../ApplicationFactory';
import { SessionStore } from 'ch-node-session-handler';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';
import { MOVED_TEMPORARILY  } from 'http-status-codes';
import { ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from '../../src/utils/Paths';
import { expect } from 'chai';

describe('EntryController', () => {

    describe('GET request', () => {
        it('should return 302 when trying to access the entry page', async () => {
            const app = createApplication(container => {
                container.bind(SessionStore).toConstantValue(createSubstituteOf<SessionStore>());
            });
            await request(app).get(ENTRY_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get('Location')).to.be.equal(PENALTY_DETAILS_PAGE_URI);
            });
        });
    });
});
import 'reflect-metadata';
import * as request from 'supertest';
import { createSubstituteOf } from '../SubstituteFactory';
import { expect } from 'chai';

import '../../src/controllers/ConfirmationController';
import { CONFIRMATION_PAGE_URI } from '../../src/utils/Paths';
import { OK } from 'http-status-codes';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { getDefaultConfig, createApp } from '../ApplicationFactory';

const config = getDefaultConfig();

describe('ConfirmationController', () => {
  describe('GET request', () => {

    const info: Record<string, any> = {
      companyNumber: '00345567'
    };
    let session = createFakeSession([], config.cookieSecret, true);
    session = session.saveExtraData('appeals', info);
    const app = createApp(session);

    it('should return 200 when trying to access page', async () => {
      await request(app).get(CONFIRMATION_PAGE_URI)
        .expect(response => {

          expect(response.text).to.contain('Appeal submitted')
            .and.to.contain(info.companyNumber);

          expect(response.status).to.be.equal(OK);
        });
    });
  });
});

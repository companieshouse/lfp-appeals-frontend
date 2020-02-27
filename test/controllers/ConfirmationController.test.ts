import 'reflect-metadata';
import * as request from 'supertest';
import { expect } from 'chai';

import '../../src/controllers/ConfirmationController';
import { CONFIRMATION_PAGE_URI } from '../../src/utils/Paths';
import { OK } from 'http-status-codes';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { getDefaultConfig, createApp } from '../ApplicationFactory';
import { Appeal } from '../../src/models/Appeal';

const config = getDefaultConfig();

describe('ConfirmationController', () => {
  describe('GET request', () => {

    const appeal = {
      penaltyIdentifier: {
          companyNumber: '00345567',
      },
  } as Appeal

    let session = createFakeSession([], config.cookieSecret, true);
    session = session.saveExtraData('appeals', appeal);
    const app = createApp(session);

    it('should return 200 when trying to access page', async () => {
      await request(app).get(CONFIRMATION_PAGE_URI)
        .expect(response => {

          expect(response.text).to.contain('Appeal submitted')
            .and.to.contain(appeal.penaltyIdentifier.companyNumber);

          expect(response.status).to.be.equal(OK);
        });
    });
  });
});

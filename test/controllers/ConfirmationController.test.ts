import 'reflect-metadata';

import { expect } from 'chai';
import { OK } from 'http-status-codes';
import * as request from 'supertest';

import 'app/controllers/ConfirmationController';
import { Appeal } from 'app/models/Appeal';
import { CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

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

import 'reflect-metadata'
import {createApplication} from '../ApplicationFactory';
import * as request from 'supertest'
import {createSubstituteOf} from '../SubstituteFactory';
import {expect} from 'chai';

import '../../src/controllers/ConfirmationController';
import {CONFIRMATION_PAGE_URI} from '../../src/utils/Paths';
import {OK} from 'http-status-codes';

const app = createApplication(container => {
});

describe('ConfirmationController', () => {
  describe('GET request', () => {

    const session: Record<string, any> = {
      companyNumber: '00345567'
    };

    it('should return 200 when trying to access page', async () => {
      await request(app).get(CONFIRMATION_PAGE_URI)
        .expect(response => {

          expect(response.text).to.contain('Appeal submitted')
            .and.to.contain(session.companyNumber);

          expect(response.status).to.be.equal(OK);
        })
    });
  });
});

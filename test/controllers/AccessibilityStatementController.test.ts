import 'reflect-metadata';

import { expect } from 'chai';
import { OK } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EntryController';
import { ACCESSIBILITY_STATEMENT_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const pageHeading = 'Accessibility statement for the Appeal a late filing penalty service';

describe('AccessibilityStatementController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access the page', async () => {
            const app = createApp();
            await request(app).get(ACCESSIBILITY_STATEMENT_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });
    });
});

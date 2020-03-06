import 'reflect-metadata';

import { expect } from 'chai';
import { NOT_FOUND } from 'http-status-codes';
import * as request from 'supertest';

import 'app/controllers/index';
import { notFoundHandler } from 'app/middleware/ErrorHandler';

import { createApp } from 'test/ApplicationFactory';

const pageHeading = 'Sorry, there is a problem with the service';
const FAKE_PAGE_URI = '/fake-page';

describe('Error Handler Middleware', () => {
    it('should render error page if redirected to wrong route', async () => {
        const app = createApp();
        app.use(notFoundHandler);
        await request(app).get(FAKE_PAGE_URI)
            .expect(response => {
                expect(response.status).to.be.equal(NOT_FOUND);
                expect(response.text).to.contain(pageHeading);
            })
        }

    );
});



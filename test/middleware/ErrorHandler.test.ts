import 'reflect-metadata';

import { expect } from 'chai';
import * as express from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import * as request from 'supertest';

import { defaultHandler, notFoundHandler } from 'app/middleware/ErrorHandler';
import { getExpressAppConfig as configureApplication } from 'app/utils/ConfigLoader';

const pageHeading = 'Sorry, there is a problem with the service';
const FAKE_PAGE_URI = '/fake-page';

function createApp(): express.Application {
    const application = express();
    configureApplication('../..')(application);
    return application;
}

describe('Error Handler Middleware', () => {
    it('should render error page if redirected to wrong route', async () => {
            const app = createApp()
                .use(notFoundHandler);

            await request(app).get(FAKE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(NOT_FOUND);
                    expect(response.text).to.contain(pageHeading);
                })
        }
    );

    it('should render error page when an error was thrown', async () => {
            const app = createApp()
                // @ts-ignore
                .use(FAKE_PAGE_URI, (req: express.Request, res: express.Response, next: express.NextFunction) => {
                    throw new Error(':(')
                })
                .use(defaultHandler);

            await request(app).get(FAKE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain(pageHeading);
                })
        }
    );
});


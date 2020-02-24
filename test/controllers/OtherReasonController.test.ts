import 'reflect-metadata';
import '../global';

import * as request from 'supertest';
import { expect } from 'chai';
import { createApplication, setupFakeAuth } from '../ApplicationFactory';

import '../../src/controllers/OtherReasonController';
import { OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import { OK, UNPROCESSABLE_ENTITY, MOVED_TEMPORARILY } from 'http-status-codes';
import { SessionStore, SessionMiddleware, CookieConfig } from 'ch-node-session';
import { Redis } from 'ioredis';
import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { RequestHandler } from 'express';
<<<<<<< HEAD
import * as CookieUtil from 'ch-node-session/lib/utils/CookieUtils';
import { returnEnvVarible } from '../../src/utils/EnvironmentUtils';
import { Session } from 'ch-node-session/lib/session/model/Session';
import { wrapValue } from 'ch-node-session/lib/utils/EitherAsyncUtils';
=======
import { returnEnvVarible } from '../../src/utils/ConfigLoader';
>>>>>>> refactor: clean up test code
const pageHeading = 'Tell us why you’re appealing this penalty';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';


const app = (sessionStore: SessionStore) => createApplication(container => {

    const config: CookieConfig = {
        cookieName: returnEnvVarible('COOKIE_NAME'),
        cookieSecret: returnEnvVarible('COOKIE_SECRET')
    };

    const sessionHandler = SessionMiddleware(config, sessionStore);
    setupFakeAuth(container);
    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(SessionStore).toConstantValue(sessionStore);

});

describe('OtherReasonController', () => {

    describe('GET request', () => {
        it('should return 200 response', async () => {

            await request(app(Substitute.for<SessionStore>())).get(OTHER_REASON_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.not.include(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 422 response with rendered error messages when invalid data was submitted', async () => {

            await request(app(Substitute.for<SessionStore>())).post(OTHER_REASON_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidTitleErrorMessage)
                        .and.to.include(invalidDescriptionErrorMessage);
                });
        });

        it('should return 200 response with rendered data when valid data was submitted', async () => {
            const title = 'Some title';
            const description = 'Some description';

            const sessionStore = Substitute.for<SessionStore>();
            sessionStore.load(Arg.any()).returns(wrapValue({ title, description }));

            await request(app(sessionStore)).post(OTHER_REASON_PAGE_URI)
                .send({ title, description })
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(title)
                        .and.to.include(description)
                        .and.to.not.include(errorSummaryHeading)
                        .and.to.not.include(invalidTitleErrorMessage)
                        .and.to.not.include(invalidDescriptionErrorMessage);
                });
        });
    });
});

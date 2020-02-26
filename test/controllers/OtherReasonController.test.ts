import 'reflect-metadata';

import * as request from 'supertest';
import { expect } from 'chai';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import '../../src/controllers/OtherReasonController';
import { OTHER_REASON_PAGE_URI } from '../../src/utils/Paths';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { wrapValue } from 'ch-node-session-handler/lib/utils/EitherAsyncUtils';
import { SessionStore } from 'ch-node-session-handler';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { Appeal } from '../../src/models/Appeal';
const pageHeading = 'Tell us why you’re appealing this penalty';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';


const config = getDefaultConfig();

describe('OtherReasonController', () => {

    describe('GET request', () => {
        it('should return 200 response', async () => {

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).get(OTHER_REASON_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.not.include(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 422 response with rendered error messages when invalid data was submitted', async () => {

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).post(OTHER_REASON_PAGE_URI)
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

            const appeal = {
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal

            let session = createFakeSession([], config.cookieSecret, true);
            session = session.saveExtraData('appeals', appeal);
            const app = createApp(session);

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send(appeal.reasons.other)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(appeal.reasons.other.title)
                        .and.to.include(appeal.reasons.other.description)
                        .and.to.not.include(errorSummaryHeading)
                        .and.to.not.include(invalidTitleErrorMessage)
                        .and.to.not.include(invalidDescriptionErrorMessage);
                });
        });
    });
});

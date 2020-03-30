import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/OtherReasonController';
import { Appeal } from 'app/models/Appeal';
import { CHECK_YOUR_APPEAL_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';
const pageHeading = 'Tell us why you’re appealing this penalty';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';


const config = getDefaultConfig();

describe('OtherReasonController', () => {

    const applicationData = {
        navigation: {
            permissions: [OTHER_REASON_PAGE_URI]
        }
    };

    describe('GET request', () => {
        it('should return 200 response', async () => {

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', applicationData);
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

        it('should return 302 response and redirect user to check your appeal page', async () => {

            const appeal = {
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal;

            let session = createFakeSession([], config.cookieSecret, true);
            session = session.saveExtraData('appeals', appeal);
            const app = createApp(session);

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send(appeal.reasons.other)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(CHECK_YOUR_APPEAL_PAGE_URI);
                });
        });
    });
});

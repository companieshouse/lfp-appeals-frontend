import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/OtherReasonController';
import { Appeal } from 'app/models/Appeal';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
const pageHeading = 'Tell us why you’re appealing this penalty';
const otherReasonHint = 'You should include your name and relationship to the company.';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';

describe('OtherReasonController', () => {

    const applicationData = {
        appeal: {
            penaltyIdentifier: {
                companyNumber: 'NI000000',
                penaltyReference: 'A00000001'
            }
        } as Appeal,
        navigation: {
            permissions: [OTHER_REASON_PAGE_URI]
        }
    };

    describe('GET request', () => {
        it('should return 200 response', async () => {

            const app = createApp(applicationData);

            await request(app).get(OTHER_REASON_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(otherReasonHint)
                        .and.not.include(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 422 response with rendered error messages when invalid data was submitted', async () => {

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'A00000001'
                }
            } as Appeal;

            const app = createApp({ appeal });

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

        it('should redirect to check your appeal page when file transfer feature is disabled', async () => {
            process.env.FILE_TRANSFER_FEATURE_ENABLED = '0';

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'A00000001'
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal;

            const app = createApp({ appeal });

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send(appeal.reasons.other)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(CHECK_YOUR_APPEAL_PAGE_URI);
                });
        });

        it('should redirect to evidence upload page when file transfer feature is enabled', async () => {
            process.env.FILE_TRANSFER_FEATURE_ENABLED = '1';

            const appeal = {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'A00000001'
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal;

            const app = createApp({ appeal });

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send(appeal.reasons.other)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(EVIDENCE_QUESTION_URI);
                });
        });
    });
});

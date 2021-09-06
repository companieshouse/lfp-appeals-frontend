import 'reflect-metadata';

import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/OtherReasonController';
import { Appeal } from 'app/models/Appeal';
import { Reasons } from 'app/models/Reasons';
import {
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const pageHeading = 'Tell us why you’re appealing this penalty';
const otherReasonHint = 'What details should I include to support my appeal?';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';
const errorServiceProblem = 'Sorry, there is a problem with the service';

describe('OtherReasonController', () => {
    const reasons = {
        other: {
            title: 'I have reasons',
            description: 'they are legit'
        }
    } as Reasons;

    const penaltyIdentifier = {
        companyNumber: 'NI000000',
        penaltyReference: 'A00000001'
    };

    const appeal = {
        createdBy: {
            name: 'SomeName',
            relationshipToCompany: 'SomeRelationship'
        },
        penaltyIdentifier
    } as Appeal;

    const appealWithReason = { ...appeal, reasons } as Appeal;
    const navigation = { permissions: [OTHER_REASON_PAGE_URI] };

    describe('GET request', () => {
        it('should return 200 response', async () => {
            const applicationData = {
                appeal: appealWithReason,
                navigation
            };

            const app = createApp(applicationData);

            await request(app).get(OTHER_REASON_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(otherReasonHint)
                        .and.not.include(errorSummaryHeading);
                });
        });

        it('should return 200 response on empty appeal reason and createdBy object', async () => {
            const app = createApp({ appeal: { penaltyIdentifier } as Appeal, navigation });

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

        it('should redirect to evidence upload page when valid data was submitted', async () => {
            const app = createApp({ appeal: appealWithReason });

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send({
                    ...reasons.other,
                    name: appeal.createdBy!.name,
                    relationshipToCompany: appeal.createdBy!.relationshipToCompany
                })
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(EVIDENCE_QUESTION_URI);
                });
        });

        it(`should fail with 500 error when passing an empty reason object`, async () => {
            const app = createApp({ appeal });

            await request(app).post(OTHER_REASON_PAGE_URI)
                .send({
                    ...reasons.other,
                    name: appeal.createdBy!.name,
                    relationshipToCompany: appeal.createdBy!.relationshipToCompany
                })
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.include(errorServiceProblem);
                });
        });
    });
});

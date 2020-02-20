import 'reflect-metadata'
import '../../src/controllers/SubmissionSummaryController'
import { createApplication } from "../ApplicationFactory";
import { RedisService } from "../../src/services/RedisService";
import { createSubstituteOf } from "../SubstituteFactory";
import * as request from "supertest";
import { SUBMISSION_SUMMARY_PAGE_URI} from "../../src/utils/Paths";
import { OK } from "http-status-codes";
import { expect } from 'chai';

const app = createApplication(container => {
    container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>());
});

describe('SubmissionSummaryController', () => {
    describe('GET request', () => {
        it('should return 200 when trying to access the submission summary', async () => {

            const session = {
                companyNumber: '00345567',
                penaltyReference: 'A00000001',
                email: 'joe@bloggs.mail',
                reason: {
                    otherReason: 'I have reasons',
                    otherInformation: 'They are legit'
                }
            };

            await request(app).get(SUBMISSION_SUMMARY_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text)
                        .to.contain(session.companyNumber).and
                        .to.contain(session.penaltyReference).and
                        .to.contain(session.email).and
                        .to.contain(session.reason.otherReason).and
                        .to.contain(session.reason.otherInformation);
                })
        });
    });
});

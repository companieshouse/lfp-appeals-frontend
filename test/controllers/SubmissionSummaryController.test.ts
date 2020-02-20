import 'reflect-metadata'
import '../../src/controllers/SubmissionSummaryController'
import { createApplication } from "../ApplicationFactory";
import {RedisService} from "../../src/services/RedisService";
import {createSubstituteOf} from "../SubstituteFactory";
import * as request from "supertest";
import {OTHER_REASON_DISCLAIMER_PAGE_URI, SUBMISSION_SUMMARY_PAGE_URI} from "../../src/utils/Paths";
import { OK } from "http-status-codes";
import { expect } from 'chai';
import {PenaltyReferenceDetails} from "../../src/models/PenaltyReferenceDetails";
import {OtherReason} from "../../src/models/OtherReason";

const app = createApplication(container => {
    container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>());
});

describe('SubmissionSummaryController', () => {
    describe('GET request', () => {
        it('should return 200 when trying to access the submission summary', async () => {
            await request(app).get(SUBMISSION_SUMMARY_PAGE_URI).expect(OK);
        });
    });
});
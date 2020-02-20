import 'reflect-metadata'
import '../../src/controllers/SubmissionSummaryController'
import { createApplication } from "../ApplicationFactory";
import { RedisService } from "../../src/services/RedisService";
import { createSubstituteOf } from "../SubstituteFactory";
import * as request from "supertest";
import { SUBMISSION_SUMMARY_PAGE_URI} from "../../src/utils/Paths";
import { OK } from "http-status-codes";

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
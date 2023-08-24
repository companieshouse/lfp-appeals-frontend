import { expect } from "chai";
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from "http-status-codes";
import { after, before } from "mocha";
import request from "supertest";

import "app/controllers/EvidenceDownloadController";
import { Appeal } from "app/models/Appeal";
import {
    CONTINUED_ILLNESS_PAGE_URI,
    ENTRY_PAGE_URI,
    ILLNESS_START_DATE_PAGE_URI
} from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";

const pageHeading: string = "When did the illness start?";
const errorSummaryHeading: string = "There is a problem";
const invalidStartDayErrorMessage: string = "You must enter a day";
const invalidStartMonthErrorMessage: string = "You must enter a month";
const invalidStartYearErrorMessage: string = "You must enter a year";
const invalidDateErrorMessage: string = "Enter a real date";
const invalidDateFutureErrorMessage: string = "Date must be today or in the past";
const errorLoadingPage = "Sorry, there is a problem with the service";
let initialIllnessReasonFeatureFlag: string | undefined;

describe("IllnessStartDateController", () => {

    before(() => {
        initialIllnessReasonFeatureFlag = process.env.ILLNESS_REASON_FEATURE_ENABLED;
    });

    after(() => {
        process.env.ILLNESS_REASON_FEATURE_ENABLED = initialIllnessReasonFeatureFlag;
    });

    const appeal = {
        penaltyIdentifier: {
            companyNumber: "NI000000",
            penaltyReference: "A00000001"
        },
        reasons: {}
    } as Appeal;

    const navigation = { permissions: [ILLNESS_START_DATE_PAGE_URI] };

    describe("GET request", () => {

        it("should return 200 when trying to access the page", async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const app = createApp({ appeal, navigation });
            await request(app).get(ILLNESS_START_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });

        it(`should return 500 when trying to access the page with no
                            navigation permission and feature flag enabled`, async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const app = createApp({ appeal });
            await request(app).get(ILLNESS_START_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                expect(response.text).to.contain(errorLoadingPage);
            });
        });

        it("should return 200 when trying to access page with a session", async () => {

            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const appealWithReasons = {
                penaltyIdentifier: {
                    companyNumber: "NI000000",
                    penaltyReference: "A00000001"
                },
                reasons: {
                    illness: {
                        illnessStart: "2020-01-01"
                    }
                }
            } as Appeal;

            const app = createApp({ appeal: appealWithReasons, navigation });
            await request(app).get(ILLNESS_START_DATE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain("id=\"start-day\" name=\"day\" type=\"text\" value=\"01\"")
                        .and.to.contain("id=\"start-month\" name=\"month\" type=\"text\" value=\"01\"")
                        .and.to.contain("id=\"start-year\" name=\"year\" type=\"text\" value=\"2020\"");
                });
        });

        it("should redirect to entry page when illness reason feature is disabled", async () => {

            process.env.ILLNESS_REASON_FEATURE_ENABLED = "0";

            const app = createApp({ appeal });
            await request(app).get(ILLNESS_START_DATE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });
    });

    describe("POST request", () => {

        beforeEach(() => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";
        });

        it("should redirect to Continued Illness page when posting a valid date", async () => {
            const app = createApp({ appeal });
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                .send({ day: "01", month: "01", year: "2020" })
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(CONTINUED_ILLNESS_PAGE_URI);
                });
        });

        it("should return 422 response with rendered error messages when empty start date was submitted", async () => {
            const app = createApp({ appeal });
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidStartDayErrorMessage)
                        .and.to.include(invalidStartMonthErrorMessage)
                        .and.to.include(invalidStartYearErrorMessage)
                        .and.to.not.include(invalidDateErrorMessage)
                        .and.to.not.include(invalidDateFutureErrorMessage);
                });
        });

        it("should return 422 response with rendered error messages when partial start date was submitted",
            async () => {
                const app = createApp({ appeal });
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({ month: "01", year: "2020" })
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidStartDayErrorMessage)
                            .and.to.not.include(invalidDateErrorMessage)
                            .and.to.not.include(invalidDateFutureErrorMessage);
                    });
            });

        it("should return 422 response with rendered error message invalid start date (all zeros) was submitted",
            async () => {
                const app = createApp({ appeal });
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({ day: "00", month: "00", year: "0000" })
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateErrorMessage);
                    });
            });

        it("should return 422 response with rendered error message invalid start date (non-existing) was submitted",
            async () => {
                const app = createApp({ appeal });
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({ day: "32", month: "13", year: "2020" })
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateErrorMessage);
                    });
            });

        it("should return 422 response with rendered error message invalid start date (in future) was submitted",
            async () => {
                const futureYear = (new Date().getFullYear() + 1).toString();
                const app = createApp({ appeal });
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({ day: "01", month: "01", year: futureYear })
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateFutureErrorMessage);
                    });
            });

        it("should redirect to entry page when illness reason feature is disabled", async () => {

            process.env.ILLNESS_REASON_FEATURE_ENABLED = "0";

            const app = createApp({ appeal });
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });
    });
});

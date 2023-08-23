import "reflect-metadata";

import { expect } from "chai";
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from "http-status-codes";
import request from "supertest";

import "app/controllers/IllnessFurtherInformationController";
import { Appeal } from "app/models/Appeal";
import { ENTRY_PAGE_URI, EVIDENCE_QUESTION_URI, FURTHER_INFORMATION_PAGE_URI } from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";

const pageHeading: string = "How did this affect your ability to file on time?";
const errorSummaryHeading: string = "There is a problem";
const errorLoadingPage = "Sorry, there is a problem with the service";
const nameErrorMessage = "Enter your name";
const descriptionErrorMessage = "You must tell us how this affected your ability to file on time";

describe("IllnessFurtherInformationController", () => {
    const appeal = {
        createdBy: {
            name: "SomeName"
        },
        penaltyIdentifier: {
            companyNumber: "NI000000",
            penaltyReference: "A00000001"
        },
        reasons: {
            illness: {
                illnessImpactFurtherInformation: "Something"
            }
        }
    } as Appeal;

    describe("GET request", () => {
        const navigation = { permissions: [FURTHER_INFORMATION_PAGE_URI] };

        it("should return 200 when trying to access illness further information page ", async () => {
            const app = createApp();
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get("Location")).to.contain("signin");
            });
        });

        it("should return 200 when trying to access the page with a bare minimum appeal object", async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const app = createApp({ appeal: { penaltyIdentifier: {}, reasons: { illness: {} } } as Appeal, navigation });
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });

        it("should return 200 when trying to access the page with correct appeal data", async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const app = createApp({ appeal, navigation });
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.include(pageHeading)
                    .and.to.include(appeal.reasons.illness!.illnessImpactFurtherInformation)
                    .and.to.include(appeal.createdBy!.name);
            });
        });

        it(`should return 500 when trying to access the page with no
                            navigation permission and feature flag enabled`, async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";

            const app = createApp({ appeal });
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                expect(response.text).to.contain(errorLoadingPage);
            });
        });

    });

    describe("POST request", () => {
        const navigation = { permissions: [EVIDENCE_QUESTION_URI] };

        beforeEach(() => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "1";
        });

        it("should redirect to entry page when illness reason feature is disabled", async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = "0";

            const app = createApp({ appeal });
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });

        it("should redirect to Evidence Question page when posting a valid further information", async () => {
            const app = createApp({ appeal, navigation });
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({ description: "Something", name: "SomeName" })
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(EVIDENCE_QUESTION_URI)
                        .and.to.not.include(nameErrorMessage)
                        .and.to.not.include(descriptionErrorMessage);
                });
        });

        it("should return 422 when missing required informations", async () => {
            const app = createApp({ appeal, navigation });
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(nameErrorMessage)
                        .and.to.include(descriptionErrorMessage);
                });
        });

        it("should return 422 when missing required informations - description", async () => {
            const app = createApp({ appeal, navigation });
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({ name: "SomeName" })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(descriptionErrorMessage)
                        .and.to.not.include(nameErrorMessage);
                });
        });

        it("should return 422 when missing required informations - name", async () => {
            const app = createApp({ appeal, navigation });
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({ description: "Something" })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(nameErrorMessage)
                        .and.to.not.include(descriptionErrorMessage);
                });
        });
    });
});

import "reflect-metadata";

import { expect } from "chai";
import { OK } from "http-status-codes";
import request from "supertest";

import "app/controllers/ConfirmationController";
import { Appeal } from "app/models/Appeal";
import { ApplicationData } from "app/models/ApplicationData";
import { Navigation } from "app/models/Navigation";
import { CONFIRMATION_PAGE_URI } from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";

describe("ConfirmationController", () => {

    const navigation = {
        permissions: [CONFIRMATION_PAGE_URI]
    } as Navigation;

    describe("GET request", () => {

        const appeal = {
            penaltyIdentifier: {
                companyNumber: "NI000000",
                companyName: "Test Ltd."
            }
        } as Appeal;

        const applicationData = {
            submittedAppeal: appeal,
            navigation
        } as ApplicationData;

        const app = createApp(applicationData);

        it("should return 200 when trying to access page", async () => {
            await request(app).get(CONFIRMATION_PAGE_URI)
                .expect(response => {

                    expect(response.text).to.contain("Appeal submitted")
                        .and.to.contain(appeal.penaltyIdentifier.companyNumber)
                        .and.to.contain(appeal.penaltyIdentifier.companyName);

                    expect(response.status).to.be.equal(OK);
                });
        });
    });
});

import { expect } from "chai";
import request from "supertest";
import { createApp } from "../ApplicationFactory";

import { Appeal } from "app/models/Appeal";
import { ApplicationData } from "app/models/ApplicationData";
import { Illness } from "app/models/Illness";
import { Reasons } from "app/models/Reasons";
import { CONTINUED_ILLNESS_PAGE_URI } from "app/utils/Paths";

describe("ContinuedIllnessController", () => {

    it("should show hint containing illness start date, and radio buttons for Yes and No on GET", async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: "NI000000"
                },
                reasons: {
                    illness: {
                        illnessStart: "2020-05-01"
                    } as Illness
                } as Reasons
            } as Appeal,
            navigation: { permissions: [CONTINUED_ILLNESS_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app).get(CONTINUED_ILLNESS_PAGE_URI).expect(res => {
            expect(res.text).to.include("class=\"govuk-hint\"");
            expect(res.text).to.include("You told us the illness started on 1 May 2020");
            expect(res.text).to.include("type=\"radio\"");
            expect(res.text).to.include("value=\"yes\"");
            expect(res.text).to.include("value=\"no\"");
            const radioCount = (res.text.match(/type="radio"/g) || []).length;
            expect(radioCount).to.equal(2);
        });

    });

    it("should show an error if no option is selected on POST", async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: "NI000000"
                },
                reasons: {
                    illness: {
                        illnessStart: "2020-05-01"
                    } as Illness
                } as Reasons
            } as Appeal,
            navigation: { permissions: [CONTINUED_ILLNESS_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app)
            .post(CONTINUED_ILLNESS_PAGE_URI)
            .send({ illnessStart: "2020-05-01" })
            .expect(res => {
                expect(res.status).to.equal(422);
                expect(res.text).to.contain("You must tell us if this is a continued illness");
            });
    });

    it("should return OK if an option is selected", async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: "NI000000"
                },
                reasons: {
                    illness: {
                        illnessStart: "2020-05-01"
                    } as Illness
                } as Reasons
            } as Appeal,
            navigation: { permissions: [CONTINUED_ILLNESS_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app)
            .post(CONTINUED_ILLNESS_PAGE_URI)
            .send({ continuedIllness: "yes" })
            .expect(res => {
                expect(res.status).to.equal(302);
            });
    });
});

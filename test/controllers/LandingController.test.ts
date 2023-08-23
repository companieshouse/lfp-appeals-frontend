import "reflect-metadata";

import { expect } from "chai";
import { MOVED_TEMPORARILY, OK } from "http-status-codes";
import request from "supertest";

import "app/controllers/LandingController";
import { ENTRY_PAGE_URI, ROOT_URI } from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";

describe("LandingController", () => {

    describe("GET request", () => {
        it(`should be redirected to the entry-page when access the
                landing-page with the start parameter equal zero`, async () => {
            const app = createApp();
            await request(app).get(`${ROOT_URI}?start=0`).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get("Location")).to.be.equal(ENTRY_PAGE_URI);
            });
        });
        it("should return 200 when trying to access the landing-page", async () => {
            const app = createApp();
            await request(app).get(ROOT_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text)
                    .to.contain("Use this service to appeal a penalty")
                    .and.to.contain("Start now");
            });
        });
    });

    describe("POST request", () => {
        it("should return 302 when trying to access the landing-page", async () => {
            const app = createApp();
            await request(app).post(ROOT_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get("Location")).to.be.equal(ENTRY_PAGE_URI);
            });
        });
    });
});

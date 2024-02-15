import * as assert from "assert";
import { expect } from "chai";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status-codes";
import nock = require("nock");

import { REFRESH_TOKEN_GRANT_TYPE } from "app/Constants";
import { RefreshTokenData } from "app/modules/refresh-token-service/RefreshTokenData";
import { RefreshTokenService } from "app/modules/refresh-token-service/RefreshTokenService";

describe("RefreshTokenService", () => {

    const CLIENT_ID: string = "1";
    const CLIENT_SECRET: string = "ABC";
    const ACCESS_TOKEN: string = "123";
    const REFRESH_TOKEN: string = "12345";
    const HOST: string = "http://localhost:4000";
    const URI: string = "/oauth2/token";
    const uriParams: string = `?grant_type=${REFRESH_TOKEN_GRANT_TYPE}&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;

    const refreshTokenData: RefreshTokenData = {
        expires_in: 3600,
        token_type: "Bearer",
        access_token: "AycNLq8ZZoeblglCUtdZUuoui9hhKn0t2rK3PxprD4fHMS21iLDb_lQf9mnkPIK5OYcGzv_I2b6RjgK2QGbWAg"
    };

    const refreshTokenDataInvalid = {
        error_description: "Unknown refresh_token",
        error: "unauthorized_client"
    };

    describe("Refreshing token", () => {

        it("should throw an error when access token is not defined", () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            [undefined, null].forEach(async accessToken => {
                try {
                    await refreshTokenService.refresh(accessToken as any, REFRESH_TOKEN);
                    assert.fail("Should have thrown an error");
                } catch (err: any) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty("message").equal("Access token is missing");
                }
            });
        });

        it("should throw an error when refresh token is not defined", () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            [undefined, null].forEach(async refreshToken => {
                try {
                    await refreshTokenService.refresh(ACCESS_TOKEN, refreshToken as any);
                    assert.fail("Should have thrown an error");
                } catch (err: any) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty("message").equal("Refresh token is missing");
                }
            });
        });

        it("should refresh access token", async () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            nock(HOST)
                .post(URI + uriParams)
                .reply(OK, refreshTokenData);

            await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    expect(response).to.equal(refreshTokenData.access_token);
                });
        });

        it("should throw error when response data is empty", async () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            nock(HOST)
                .post(URI + uriParams)
                .reply(OK, {});

            try {
                await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN);
                assert.fail("Could not refresh token");
            } catch (err: any) {
                expect(err).to.be.instanceOf(Error)
                    .and.to.haveOwnProperty("message").equal("Could not refresh token");
            }
        });

        it("should return status 400 when refresh token is invalid", async () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            nock(HOST)
                .post(URI + uriParams)
                .reply(BAD_REQUEST, refreshTokenDataInvalid);

            try {
                await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN);
                assert.fail("Should have thrown an error");
            } catch (err: any) {
                expect(err).to.be.instanceOf(Error)
                    .and.to.haveOwnProperty("message").equal("Request failed with status code 400");
            }
        });

        it("should return status 500 when internal server error", async () => {

            const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

            nock(HOST)
                .post(URI + uriParams)
                .reply(INTERNAL_SERVER_ERROR);

            try {
                await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN);
                assert.fail("Should have thrown an error");
            } catch (err: any) {
                expect(err).to.be.instanceOf(Error)
                    .and.to.haveOwnProperty("message").equal("Request failed with status code 500");
            }
        });
    });
});

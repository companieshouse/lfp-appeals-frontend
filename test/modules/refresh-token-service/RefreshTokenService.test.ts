import * as assert from 'assert';
import { expect } from 'chai';
import nock = require('nock');

import { GRANT_TYPE } from 'app/Constants';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import { RefreshTokenService } from 'app/modules/refresh-token-service/RefreshTokenService';
import { RefreshTokenError } from 'app/modules/refresh-token-service/errors';

describe('RefreshTokenService', () => {

    const HOST: string = 'http://localhost:4000';
    const CLIENT_ID: string = '1';
    const CLIENT_SECRET: string = 'ABC';
    const ACCESS_TOKEN: string = '123';
    const REFRESH_TOKEN: string = '12345';
    const URI: string = `/oauth2/token?grant_type=${GRANT_TYPE}&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const refreshTokenService = new RefreshTokenService(HOST + URI, CLIENT_ID, CLIENT_SECRET);

    const refreshTokenData: RefreshTokenData = {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'access_token': 'AycNLq8ZZoeblglCUtdZUuoui9hhKn0t2rK3PxprD4fHMS21iLDb_lQf9mnkPIK5OYcGzv_I2b6RjgK2QGbWAg'
    };

    const refreshTokenDataInvalid = {
        'error_description': 'Unknown refresh_token',
        'error': 'unauthorized_client'
    };

    describe('Refreshing token', () => {

        it('should throw an error when access token is not defined', () => {

            [undefined, null].forEach(async accessToken => {
                try {
                    await refreshTokenService.refresh(accessToken as any, REFRESH_TOKEN);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Access token is missing');
                }
            });
        });

        it('should throw an error when refresh token is not defined', () => {

            [undefined, null].forEach(async refreshToken => {
                try {
                    await refreshTokenService.refresh(ACCESS_TOKEN, refreshToken as any);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Refresh token is missing');
                }
            });
        });

        it('should refresh token', async () => {

            nock(HOST)
                .post(URI)
                .reply(200, refreshTokenData);

            await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN)
                .then((response: string) => {
                    console.log(response);
                    expect(response).to.equal(refreshTokenData.access_token);
                });
        });

        it('should return status 400 when refresh token is invalid', async () => {

            nock(HOST)
                .post(URI)
                .reply(400, refreshTokenDataInvalid);

            try {
                await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN);
            } catch (err) {
                expect(err).to.be.instanceOf(RefreshTokenError).and.to.haveOwnProperty('message')
                    .equal(`Refresh token failed due to error: request failed with status code 400`);
            }
        });

        it('should return status 500 when internal server error', async () => {

            nock(HOST)
                .post(URI)
                .reply(500);

            try {
                await refreshTokenService.refresh(ACCESS_TOKEN, REFRESH_TOKEN);
                assert.fail('Test should failed while it did not');
            } catch (err) {
                expect(err).to.be.instanceOf(RefreshTokenError).and.to.haveOwnProperty('message')
                    .equal(`Refresh token failed due to error: request failed with status code 500`);
            }
        });
    });
});

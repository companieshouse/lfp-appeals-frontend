import { Arg, SubstituteOf } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import ApiClient from 'ch-sdk-node/dist/client';
import { RefreshTokenService } from 'ch-sdk-node/dist/services/refresh-token';
import Resource from 'ch-sdk-node/dist/services/resource';
import { expect } from 'chai';

import { REFRESH_TOKEN_GRANT_TYPE } from 'app/Constants';
import { RefreshOauthTokenService } from 'app/modules/refresh-token-service/RefreshOauthTokenService';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import {
    RefreshTokenBadRequestError,
    RefreshTokenServiceError,
    RefreshTokenUnauthorisedError
} from 'app/modules/refresh-token-service/errors';

import { createSubstituteOf } from 'test/SubstituteFactory';

const refreshTokenServiceSubstitute = (method: 'resolves' | 'rejects', response: Resource<RefreshTokenData>) => {
    return createSubstituteOf<RefreshTokenService>(service => {
        service.refresh(Arg.any(), Arg.any(), Arg.any(), Arg.any())[method](response);
    });
};

const apiClientSubstitute = (refreshTokenService: SubstituteOf<RefreshTokenService>) => {
    return createSubstituteOf<ApiClient>(client => {
        // @ts-ignore
        client.refreshToken.returns(refreshTokenService);
    });
};

describe('RefreshTokenService', () => {

    const CLIENT_ID: string = '1';
    const CLIENT_SECRET: string = 'ABC';
    const REFRESH_TOKEN: string = '12345';

    describe('Refreshing token', () => {

        it('should throw an error when refresh token is not defined', () => {

            const refreshOauthTokenService = new RefreshOauthTokenService(createSubstituteOf<ApiClient>(),
                CLIENT_ID, CLIENT_SECRET);

            [undefined, null].forEach(async refreshToken => {
                try {
                    await refreshOauthTokenService.refresh(refreshToken as any);
                    assert.fail('Should have thrown an error');
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Refresh token is missing');
                }
            });
        });

        it('should refresh access token', async () => {

            const response: Resource<RefreshTokenData> = {
                httpStatusCode: 200,
                resource: {
                    'expires_in': 3600,
                    'token_type': 'Bearer',
                    'access_token': '123'
                },
            };

            const refreshTokenService = refreshTokenServiceSubstitute('resolves', response);
            const apiClient = apiClientSubstitute(refreshTokenService);

            const refreshOauthTokenService: RefreshOauthTokenService =
                new RefreshOauthTokenService(apiClient, CLIENT_ID, CLIENT_SECRET);

            const refreshedAccessToken: string = await refreshOauthTokenService.refresh(REFRESH_TOKEN);

            expect(refreshedAccessToken).to.be.equal(response.resource?.access_token);

            refreshTokenService.received().refresh(REFRESH_TOKEN, REFRESH_TOKEN_GRANT_TYPE, CLIENT_ID, CLIENT_SECRET);
        });

        it('should throw error when status is not 200 and resource is empty', async () => {

            const refreshTokenService = refreshTokenServiceSubstitute('resolves', { httpStatusCode: 200 });
            const apiClient = apiClientSubstitute(refreshTokenService);
            const refreshOauthTokenService = new RefreshOauthTokenService(apiClient, CLIENT_ID, CLIENT_SECRET);
            try {

                await refreshOauthTokenService.refresh(REFRESH_TOKEN);
                assert.fail('Should have thrown an error');
            } catch (err) {
                expect(err.constructor.name).eq(RefreshTokenServiceError.name);
                expect(err.message).to.include(`Refresh token failed`);
            }
        });

        it('should throw error when status is 400', async () => {

            const refreshTokenService = refreshTokenServiceSubstitute('resolves', { httpStatusCode: 400 });
            const apiClient = apiClientSubstitute(refreshTokenService);
            const refreshOauthTokenService = new RefreshOauthTokenService(apiClient, CLIENT_ID, CLIENT_SECRET);

            try {
                await refreshOauthTokenService.refresh(REFRESH_TOKEN);
                assert.fail('Should have thrown an error');
            } catch (err) {
                expect(err.constructor.name).eq(RefreshTokenBadRequestError.name);
                expect(err.message).to.include(`Refresh token failed with invalid data`);
            }
        });

        it('should throw error when status is 401', async () => {

            const refreshTokenService = refreshTokenServiceSubstitute('resolves', { httpStatusCode: 401 });
            const apiClient = apiClientSubstitute(refreshTokenService);
            const refreshOauthTokenService = new RefreshOauthTokenService(apiClient, CLIENT_ID, CLIENT_SECRET);

            try {
                await refreshOauthTokenService.refresh(REFRESH_TOKEN);
                assert.fail('Should have thrown an error');
            } catch (err) {
                expect(err.constructor.name).eq(RefreshTokenUnauthorisedError.name);
                expect(err.message).to.include(`Refresh token unauthorised`);
            }
        });
    });
});

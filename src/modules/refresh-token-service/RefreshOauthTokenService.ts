import { REFRESH_TOKEN_GRANT_TYPE } from 'Constants';
import ApiClient from 'ch-sdk-node/dist/client';
import { RefreshTokenService } from 'ch-sdk-node/dist/services/refresh-token';
import Resource from 'ch-sdk-node/dist/services/resource';
import { BAD_REQUEST, OK, UNAUTHORIZED } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import {
    RefreshTokenBadRequestError,
    RefreshTokenServiceError,
    RefreshTokenUnauthorisedError
} from 'app/modules/refresh-token-service/errors';

export class RefreshOauthTokenService {

    constructor(private readonly apiClient: ApiClient, private readonly clientId: string,
                private readonly clientSecret: string) {
        this.apiClient = apiClient;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public async refresh(refreshToken: string): Promise<string> {

        if (refreshToken == null) {
            throw new Error('Refresh token is missing');
        }

        return await this.apiClient.refreshToken.refresh(refreshToken, REFRESH_TOKEN_GRANT_TYPE, this.clientId,
            this.clientSecret)
            .then((response: Resource<RefreshTokenData>) => {
                if (response.httpStatusCode === OK && response.resource) {
                    loggerInstance()
                        .info(`${RefreshTokenService.name} - refresh: created new access token - ${response.resource.access_token}`);
                    return response.resource.access_token;
                }
                this.handleStatusCode(response.httpStatusCode);
            });
    }

    private handleStatusCode(statusCode: number): never {
        switch (statusCode) {
            case UNAUTHORIZED:
                throw new RefreshTokenUnauthorisedError('Refresh token unauthorised');
            case BAD_REQUEST:
                throw new RefreshTokenBadRequestError('Refresh token failed with invalid data');
            default:
                throw new RefreshTokenServiceError('Refresh token failed');
        }
    }
}

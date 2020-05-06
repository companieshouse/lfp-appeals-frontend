import { GRANT_TYPE } from 'Constants';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OK } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';
import { RefreshTokenData } from 'app/modules/refresh-token-service/RefreshTokenData';
import { RefreshTokenError } from 'app/modules/refresh-token-service/errors';

export class RefreshTokenService {

    constructor(private readonly uri: string, private readonly clientId: string,
                private readonly clientSecret: string) {
        this.uri = uri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public async refresh(accessToken: string, refreshToken: string): Promise<string> {

        if (accessToken == null) {
            throw new Error('Access token is missing');
        }

        if (refreshToken == null) {
            throw new Error('Refresh token is missing');
        }

        const requestParams: AxiosRequestConfig = {
            params: {
                'grant_type': GRANT_TYPE,
                'refresh_token': refreshToken,
                'client_id': this.clientId,
                'client_secret': this.clientSecret
            }
        };

        loggerInstance()
            .debug(`Making a POST request to ${this.uri} for refreshing access token ${accessToken}`);

        return await axios
            .post(this.uri, requestParams)
            .then((response: AxiosResponse<RefreshTokenData>) => {
                if (response.status === OK && response.data) {
                    loggerInstance()
                        .info(`${RefreshTokenService.name} - refresh: token refreshed ${response.data}`);
                    return response.data.access_token;
                }
                throw new Error('Could not refresh token');
            }).catch(err => {
                throw new RefreshTokenError(`Refresh token failed due to error: ${(err.message || 'unknown error')
                    .toLowerCase()}`);
            });
    }
}
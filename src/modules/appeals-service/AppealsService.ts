import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CREATED, NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { AppealNotFoundError, AppealServiceError, AppealUnauthorisedError, AppealUnprocessableEntityError } from './errors';

import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { RefreshOauthTokenService } from 'app/modules/refresh-token-service/RefreshOauthTokenService';

export class AppealsService {

    private readonly axiosInstance: AxiosInstance;

    constructor(private readonly uri: string, private readonly refreshTokenService: RefreshOauthTokenService) {
        this.uri = uri;
        this.refreshTokenService = refreshTokenService;
        this.axiosInstance = axios.create();
    }

    public async getAppeal(companyNumber: string, appealId: string, accessToken: string,
                           refreshToken: string): Promise<Appeal> {

        this.checkArgumentOrThrow(companyNumber, 'Company number is missing');
        this.checkArgumentOrThrow(appealId, 'Appeal id is missing');
        this.checkArgumentOrThrow(accessToken, 'Access token is missing');
        this.checkArgumentOrThrow(refreshToken, 'Refresh token is missing');

        this.refreshTokenInterceptor(accessToken, refreshToken);

        const uri: string = `${this.uri}/companies/${companyNumber}/appeals/${appealId}`;
        loggerInstance()
            .debug(`Making a GET request to ${uri}`);

        return await this.axiosInstance
            .get(uri)
            .then((response: AxiosResponse<Appeal>) => response.data)
            .catch(this.handleResponseError('get', appealId));

    }

    public async save(appeal: Appeal, accessToken: string, refreshToken: string): Promise<string> {
        this.checkArgumentOrThrow(appeal, 'Appeal data is missing');
        this.checkArgumentOrThrow(accessToken, 'Access token is missing');
        this.checkArgumentOrThrow(refreshToken, 'Refresh token is missing');

        this.refreshTokenInterceptor(accessToken, refreshToken);

        const uri: string = `${this.uri}/companies/${appeal.penaltyIdentifier.companyNumber}/appeals`;

        loggerInstance()
            .debug(`Making a POST request to ${uri}`);

        return await this.axiosInstance
            .post(uri, appeal)
            .then((response: AxiosResponse<string>) => {
                if (response.status === CREATED && response.headers.location) {
                    loggerInstance()
                        .info(`${AppealsService.name} - save: created resource ${response.data} - ${response.headers.location}`);
                    return response.data.toString();
                }
                throw new Error('Could not create appeal resource');
            })
            .catch(this.handleResponseError('save'));
    }

    private checkArgumentOrThrow<T>(arg: T, errorMessage: string): void {
        if (arg == null) {
            throw new Error(errorMessage);
        }
    }

    private handleResponseError(operation: 'get' | 'save', subject?: string): (_: AxiosError) => never {
        return (err: AxiosError) => {
            const concatPrefixToSubject = (prefix: string) => `${subject ? `${prefix ? ` ${prefix} ${subject} ` : ` ${subject} `}` : ' '}`;
            if (err.isAxiosError && err.response != null) {
                switch (err.response.status) {
                    case NOT_FOUND:
                        throw new AppealNotFoundError(`${operation} appeal failed because appeal${concatPrefixToSubject('')}was not found`);
                    case UNAUTHORIZED:
                        throw new AppealUnauthorisedError(`${operation} appeal unauthorised`);
                    case UNPROCESSABLE_ENTITY:
                        throw new AppealUnprocessableEntityError(`${operation} appeal on invalid appeal data`);
                }
            }
            throw new AppealServiceError(
                `${operation} appeal failed${concatPrefixToSubject('on appeal')}with message: ${err.message || 'unknown error'}`
            );
        };
    }

    private getHeaders(token: string): AxiosRequestConfig['headers'] {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
    }

    private refreshTokenInterceptor(accessToken: string, refreshToken: string): void {

        this.axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
                if (!config.headers.Authorization) {
                    config.headers = this.getHeaders(accessToken);
                }
                return config;
            },
            async (error: AxiosError) => {
                return Promise.reject(error);
            });

        this.axiosInstance.interceptors.response.use((response: AxiosResponse) => {
            return response;
        }, async (error) => {

            const requestConfig = error.config;
            const response: AxiosResponse | undefined = error.response;

            if (response && response.status === UNAUTHORIZED && !requestConfig._isRetry) {
                requestConfig._isRetry = true;
                loggerInstance()
                    .info(`${AppealsService.name} - create appeal failed with: ${response.status} - attempting token refresh`);
                const newAccessToken: string = await this.refreshTokenService.refresh(refreshToken);
                if (newAccessToken) {
                    requestConfig.headers = this.getHeaders(newAccessToken);
                    return this.axiosInstance(requestConfig);
                }
            }
            return Promise.reject(error);
        });
    }
}

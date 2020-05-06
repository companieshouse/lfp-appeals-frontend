import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CREATED, NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { AppealNotFoundError, AppealServiceError, AppealUnauthorisedError, AppealUnprocessableEntityError } from './errors';

import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { RefreshTokenService } from 'app/modules/refresh-token-service/RefreshTokenService';

export class AppealsService {

    constructor(private readonly uri: string, private readonly refreshTokenService: RefreshTokenService) {
        this.uri = uri;
        this.refreshTokenService = refreshTokenService;
    }

    public async getAppeal(companyNumber: string, appealId: string, token: string): Promise<Appeal> {

        this.checkArgumentOrThrow(companyNumber, 'Company number is missing');
        this.checkArgumentOrThrow(appealId, 'Appeal id is missing');
        this.checkArgumentOrThrow(token, 'Token is missing');

        const uri: string = `${this.uri}/companies/${companyNumber}/appeals/${appealId}`;
        loggerInstance()
            .debug(`Making a GET request to ${uri}`);

        return axios
            .get(uri, this.getConfig(token))
            .then((response: AxiosResponse<Appeal>) => response.data)
            .catch(this.handleResponseError('get', appealId));

    }

    public async save(appeal: Appeal, accessToken: string, refreshToken: string): Promise<string> {

        this.checkArgumentOrThrow(appeal, 'Appeal data is missing');
        this.checkArgumentOrThrow(accessToken, 'Token is missing');

        const uri: string = `${this.uri}/companies/${appeal.penaltyIdentifier.companyNumber}/appeals`;

        loggerInstance()
            .debug(`Making a POST request to ${uri}`);

        return await axios
            .post(uri, appeal, this.getConfig(accessToken))
            .then((response: AxiosResponse<string>) => {
                if (response.status === CREATED && response.headers.location) {
                    loggerInstance()
                        .info(`${AppealsService.name} - save: created resource ${response.data} - ${response.headers.location}`);
                    return response.data.toString();
                }
                throw new Error('Could not create appeal resource');
            })
            .catch(err => {
                if (err.response != null && err.response.status === UNAUTHORIZED) {
                    // refresh token
                    this.refreshTokenService.refresh(accessToken,refreshToken);
                    // retry submit appeal
                    // update token in session
                }

                // TODO
                return '';
            })
            .catch(this.handleResponseError('save'));
    }

    private checkArgumentOrThrow<T>(arg: T, errorMessage: string): void {
        if (arg == null) {
            throw new Error(errorMessage);
        }
    }

    private getConfig(token: string): AxiosRequestConfig {
        return {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + token
            }
        };
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
                `${operation} appeal failed${concatPrefixToSubject('on appeal')}with message ${err.message || 'unknown error'}: `
            );
        };
    }
}

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CREATED } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';

export class AppealsService {

    constructor(private readonly uri: string) {
        this.uri = uri;
    }

    public async getAppeal(companyNumber: string, appealId: string, token: string): Promise<Appeal> {

        this.checkArgumentOrThrow(companyNumber, 'Company number is missing');
        this.checkArgumentOrThrow(appealId, 'Appeal id is missing');
        this.checkArgumentOrThrow(token, 'Token is missing');

        const uri: string = `${this.uri}/companies/${companyNumber}/appeals/${appealId}`;

        return await axios
            .get(uri, this.getConfig(token))
            .then((response: AxiosResponse<Appeal>) => response.data);

    }

    public async save(appeal: Appeal, token: string): Promise<string> {

        this.checkArgumentOrThrow(appeal, 'Appeal data is missing');
        this.checkArgumentOrThrow(token, 'Token is missing');

        const uri: string = `${this.uri}/companies/${appeal.penaltyIdentifier.companyNumber}/appeals`;

        loggerInstance()
            .debug(`Making a POST request to ${uri}`);

        return await axios
            .post(uri, appeal, this.getConfig(token))
            .then((response: AxiosResponse) => {
                if (response.status === CREATED && response.headers.location) {
                    loggerInstance()
                        .info(`${AppealsService.name} - save: created resource ${response.headers.location}`);
                    return response.headers.location;
                }
            });
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
}

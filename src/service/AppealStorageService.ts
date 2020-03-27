import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CREATED } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';

export class AppealStorageService {

    constructor(private readonly uri: string) {
        this.uri = uri;
    }

    public async save(appeal: Appeal, token: string): Promise<string> {

        if (appeal == null) {
            throw new Error('Appeal data is missing');
        }

        if (token == null) {
            throw new Error('Token is missing');
        }

        const config: AxiosRequestConfig = {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + token
            }
        };

        const uri: string = `${this.uri}/companies/${appeal.penaltyIdentifier.companyNumber}/appeals`;

        loggerInstance()
            .debug('Making a POST request to ' + uri);

        return await axios
            .post(uri, appeal, config)
            .then((response: AxiosResponse) => {
                if (response.status === CREATED && response.headers.location) {
                    loggerInstance().info(`${AppealStorageService.name} - save: Created appeal`);
                    return response.headers.location;
                }
            });
    }
}

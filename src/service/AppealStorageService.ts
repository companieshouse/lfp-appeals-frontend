import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { Appeal } from 'app/models/Appeal';

export class AppealStorageService {

    constructor(private readonly uri: string) {
        this.uri = uri;
    }

    public async save(appealData: Appeal, token: string): Promise<any> {

        if (token == null) {
            throw new Error('Token is missing');
        }

        const config: AxiosRequestConfig = {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + token
            }
        };

        const uri: string = `${this.uri}/companies/${appealData.penaltyIdentifier.companyNumber}/appeals`;

        console.log('Making a POST request to ' + uri);

        return await axios
            .post(uri, appealData, config)
            .then((response: AxiosResponse) => {
                return response;
            });
    }
}

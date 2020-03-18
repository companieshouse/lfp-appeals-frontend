import axios, { AxiosRequestConfig } from 'axios';

import { Appeal } from 'app/models/Appeal';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

export class AppealStorageService {

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

        const apiUri = getEnvOrThrow(`APPEALS_API_URL`);

        const uri: string = `${apiUri}/companies/${appealData.penaltyIdentifier.companyNumber}/appeals`;

        console.log('Making a POST request to ' + uri);

        return await axios
            .post(uri, appealData, config)
            .then(response => {
                return response.data;
            });
    }
}

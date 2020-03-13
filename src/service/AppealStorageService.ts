import axios, { AxiosRequestConfig } from 'axios';

import { Appeal } from 'app/models/Appeal';

export class AppealStorageService {

    constructor(private readonly appealsApiUrl: string) {
        this.appealsApiUrl = appealsApiUrl;
    }

    public async store(appealData: Appeal, companyId: string, token: string): Promise<any> {

        if (token == null) {
            throw new Error('Token is missing');
        }

        const config: AxiosRequestConfig = {
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + token
            }
        }

        const uri: string = `${this.appealsApiUrl}/companies/${companyId}/appeals`;

        console.log('Making a POST request to ' + uri);

        return await axios
            .post(uri, appealData, config)
            .then(response => {
                console.log(response.data)
                return response.data
            })
            .catch(err => {
                throw err
            });
    }
}

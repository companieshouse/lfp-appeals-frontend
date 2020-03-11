import axios, { AxiosRequestConfig } from 'axios';

import { Appeal } from 'app/models/Appeal';

export class AppealSubmissionService {
    constructor(private readonly appealsApiUrl: string) {
    }

    public async submitAppeal(appealData: Appeal, companyId: string, token: string): Promise<any> {

        try {

            const config: AxiosRequestConfig = {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer ' + token
                }
            }

            return axios.post(this.appealsApiUrl + '/companies/' + companyId + '/appeals', appealData, config);

        } catch (e) {

            console.log(e);

        }

    }

}

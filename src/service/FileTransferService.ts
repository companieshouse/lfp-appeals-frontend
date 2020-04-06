import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';

export class FileTransferService {

    constructor(private readonly url: string, private readonly key: string) {
        this.url = url;
        this.key = key;
    }

    public async upload(file: Buffer, fileName: string): Promise<string> {

        if (file == null) {
            throw new Error('File is missing');
        }

        if (fileName == null) {
            throw new Error('File name is missing');
        }

        const data = new FormData();
        data.append('upload', file, fileName);

        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key,
                ...data.getHeaders()
            }
        };

        loggerInstance()
            .debug(`Making a POST request to ${this.url}`);

        return await axios
            .post(this.url, data, config)
            .then((response: AxiosResponse) => {
                if (response.status === CREATED && response.data.id) {
                    return response.data.id;
                }
            });
    }
}

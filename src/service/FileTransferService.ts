import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';

import { loggerInstance } from 'app/middleware/Logger';

export class FileTransferService {

    constructor(private readonly url: string, private readonly key: string) {
        if (url == null) {
            throw new Error('URI for File Transfer API is missing');
        }
        if (key == null) {
            throw new Error('API key for File Transfer API is missing');
        }
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
            }).catch((err) => {
                if (err.code === UNSUPPORTED_MEDIA_TYPE) {
                    throw new Error('Unsupported file type')
                } else {
                    throw new Error(err.message)
                }
            });
    }
}

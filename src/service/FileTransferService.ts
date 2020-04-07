import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED, NOT_FOUND } from 'http-status-codes';
import { Readable} from 'stream';

import { loggerInstance } from 'app/middleware/Logger';
import { FileMetadata } from 'app/models/FileMetadata';

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

    async getFileMetadata(fileId: string): Promise<FileMetadata> {

        if (fileId == null) {
            throw new Error('File ID is missing');
        }

        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
        };

        return axios
            .get<FileMetadata>(`${this.url}/${fileId}`, config)
            .then((axiosResponse: AxiosResponse<FileMetadata>) => axiosResponse.data)
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });
    }

    async download(fileId: string): Promise<Readable> {

        if (fileId == null) {
            throw new Error('File ID is missing');
        }

        const url = `${this.url}/${fileId}/download`;
        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
            responseType: 'stream'
        };

        return axios.get<Readable>(url, config)
            .then(async (axiosResponse: AxiosResponse<Readable>) => axiosResponse.data)
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });

    }

    private getErrorFrom(err: any, fileId: string): Error {

        if (err.isAxiosError) {
            switch (err.response.status) {
                case NOT_FOUND:
                    return new Error(`File ${fileId} not found.`);
            }
        }
        return new Error(err.message);

    }

}

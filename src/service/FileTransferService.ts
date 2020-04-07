import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED, NOT_FOUND, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import { Readable } from 'stream';

import { loggerInstance } from 'app/middleware/Logger';
import { FileMetadata } from 'app/models/FileMetadata';

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
                ...this.prepareHeaders(),
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
                    throw new Error('Unsupported file type');
                } else {
                    throw new Error(err.message);
                }
            });
    }

    async getFileMetadata(fileId: string): Promise<FileMetadata> {

        if (fileId == null) {
            throw new Error('File ID is missing');
        }

        const config: AxiosRequestConfig = {
            headers: this.prepareHeaders()
        };

        return axios
            .get<FileMetadata>(`${this.url}/${fileId}`, config)
            .then((response: AxiosResponse<FileMetadata>) => response.data)
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });
    }

    async download(fileId: string): Promise<Readable> {

        if (fileId == null) {
            throw new Error('File ID is missing');
        }

        const config: AxiosRequestConfig = {
            headers: this.prepareHeaders(),
            responseType: 'stream'
        };

        return axios.get<Readable>(`${this.url}/${fileId}/download`, config)
            .then((response: AxiosResponse<Readable>) => response.data)
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });

    }

    public async delete(fileId: string): Promise<void> {

        if (fileId == null) {
            throw new Error('File ID is missing');
        }

        const config: AxiosRequestConfig = {
            headers: this.prepareHeaders()
        };

        return axios
            .delete(`${this.url}/${fileId}`, config)
            .then(() => {
                return
            }).catch((err) => {
                if (err.response.status === NOT_FOUND) {
                    throw new Error(`File ${fileId} cannot be deleted because it does not exist`)
                }
                throw new Error(`File ${fileId} cannot be deleted due to error: ${(err.message || 'unknown error').toLowerCase()}`)
            });
    }

    private prepareHeaders(): Record<string, string> {
        return {
            'x-api-key': this.key
        }
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

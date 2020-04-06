import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED, NOT_FOUND, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import * as stream from 'stream';
import { FileNotFoundError } from './error/FileNotFoundError';
import { FileTransferServiceError } from './error/FileTransferServiceError';

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
            }).catch((err) => {
                if (err.code === UNSUPPORTED_MEDIA_TYPE) {
                    throw new Error('Unsupported file type');
                } else {
                    throw new Error(err.message);
                }
            });
    }

    async getFileMetadata(fileId: string): Promise<FileMetadata> {

        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
        };

        return await axios
            .get<FileMetadata>(`${this.url}/${fileId}`, config)
            .then((axiosResponse: AxiosResponse<FileMetadata>) => axiosResponse.data)
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });
    }

    async download(fileId: string,
        writableStream: stream.Writable,
        onStart?: (axiosResponse: AxiosResponse<stream.Readable>) => void): Promise<void> {

        const url = `${this.url}/${fileId}/download`;
        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
            responseType: 'stream'
        };

        return axios.get<stream.Readable>(url, config)
            .then(async (axiosResponse: AxiosResponse<stream.Readable>) => {
                if (onStart) {
                    onStart(axiosResponse);
                }
                await this.pipeDataIntoStream(axiosResponse, writableStream);
            })
            .catch(err => {
                throw this.getErrorFrom(err, fileId);
            });

    }

    public async pipeDataIntoStream(axiosResponse: AxiosResponse<stream.Readable>,
        writableStream: stream.Writable): Promise<void> {

        return new Promise<void>((resolve, reject) => axiosResponse.data.pipe(writableStream)
            .on('finish', resolve)
            .on('error', reject));
    }

    private getErrorFrom(err: any, fileId: string): Error {

        if (err.isAxiosError) {
            switch (err.response.status) {
                case NOT_FOUND:
                    return new FileNotFoundError(fileId, err.message);
                default:
                    return new FileTransferServiceError(fileId, err.response.status, err.message);
            }
        }

        return Error(err.message);

    }

}

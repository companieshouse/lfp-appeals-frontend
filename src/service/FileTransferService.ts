import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Response } from 'express';
import FormData from 'form-data';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import * as stream from 'stream';
import { FileDownloadError } from './error/FileDownloadError';
import { FileNotFoundError } from './error/FileNotFoundError';

import { loggerInstance } from 'app/middleware/Logger';
import { FileMetada } from 'app/models/FileMetada';

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

    async fileMetada(fileId: string): Promise<FileMetada> {
        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
        };

        return await axios
            .get<FileMetada>(`${this.url}/${fileId}`, config)
            .then(_ => _.data)
            .catch(_ => {
                throw new FileNotFoundError(fileId, _.message);
            });
    }

    async download(fileId: string, res: stream.Writable): Promise<void> {

        const url = `${this.url}/${fileId}/download`;
        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
            responseType: 'stream'
        };

        return axios.get<stream.Readable>(url, config)
            .then(async (axiosResponse: AxiosResponse<stream.Readable>) => {

                if ((res as Response).setHeader) {
                    const response = res as Response;
                    response.setHeader('Content-Type', axiosResponse.headers['content-type']);
                    response.setHeader('Content-Length', axiosResponse.headers['content-length']);
                    response.setHeader('Content-Disposition', axiosResponse.headers['content-disposition']);
                }
                await this.pipeDataIntoStream(axiosResponse, res);
            })
            .catch(_ => {
                throw new FileDownloadError(fileId, _.message);
            });

    }

    private async pipeDataIntoStream(axiosResponse: AxiosResponse<stream.Readable>,
                                       writableStream: stream.Writable): Promise<void> {
        return new Promise<void>((resolve, reject) => axiosResponse.data.pipe(writableStream)
            .on('finish', resolve)
            .on('error', reject));
    }

}

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as Fs from 'fs';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';

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
                throw Error(`Could not retrieve file metada. ${_.message}`);
            });
    }

    async download(fileId: string, downloadDir: string): Promise<void> {

        const url = `${this.url}/${fileId}/download`;
        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
            responseType: 'stream'
        };

        return axios.get<Fs.ReadStream>(url, config)
            .then((_: AxiosResponse<Fs.ReadStream>) => {
                const parsedHeaders = _.headers['content-disposition'].split(';');
                const filename = parsedHeaders[1].split('=')[1];
                this.writeToFile(`${downloadDir}/${filename}`, _.data);
            })
            .catch(_ => {
                throw Error(`Could not download file metada. ${_.message}`);
            });

    }

    public writeToFile(path: string, data: Fs.ReadStream): void {
        const writeStream = Fs.createWriteStream(path, {
            autoClose: true
        });

        data.pipe(writeStream);
    }
}

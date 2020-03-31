import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as Fs from 'fs';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import * as Path from 'path';
import { promisify } from 'util';

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
            .get<FileMetada>(`https://${this.url}/${fileId}`, config)
            .then(_ => _.data)
            .catch(_ => {
                throw Error(`Could not retrieve file metada. Status: ${_.status}`);
            });
    }

    async download(fileId: string): Promise<void> {
        // File name has to have the original name. Make call to FILE_TRANSFER_API to get the metadata
        const fileMetada = await this.fileMetada(fileId);

        // Make download request: GET https://{{FILE_TRANSFER_API_URL}}/dev/files/{{req.file_id}}/download
        const url = `https://${this.url}/${fileId}`;
        const path = Path.resolve(__dirname, 'images', fileMetada.name);

        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key
            },
            responseType: 'stream'
        };

        return axios.get<Buffer>(url, config)
            .then(async (_: AxiosResponse<Buffer>) => await this.writeToFile(path, _.data))
            .catch(_ => {
                throw Error(`Could not download file metada. Status: ${_.status}`);
            });

    }

    private async writeToFile(path: string, data: any): Promise<void> {
        const writeToFile = promisify(Fs.writeFile);
        return writeToFile(path, data);
    }
}

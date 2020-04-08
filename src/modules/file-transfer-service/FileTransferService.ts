import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { NOT_FOUND, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import { Readable } from 'stream';

import { FileMetadata } from 'app/models/FileMetadata';
import { FileTransferError } from 'app/modules/file-transfer-service/errors';

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

        return await axios
            .post(this.url, data, config)
            .then((response: AxiosResponse) => { return response.data.id })
            .catch(this.handleResponseError('upload', fileName));
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
            .catch(this.handleResponseError('metadata retrieval', fileId));
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
            .catch(this.handleResponseError('download', fileId));
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
            .then(() => { return })
            .catch(this.handleResponseError('deletion', fileId));
    }

    private prepareHeaders(): Record<string, string> {
        return {
            'x-api-key': this.key
        }
    }

    private handleResponseError(operation: 'upload' | 'metadata retrieval' | 'download' | 'deletion', subject: string):
        (err: AxiosError) => never {
        return (err: AxiosError) => {
            let message;
            if (err.isAxiosError) {
                switch (err.response!.status) {
                    case NOT_FOUND:
                        message = `File ${operation} failed because "${subject}" file does not exist`;
                        break;
                    case UNSUPPORTED_MEDIA_TYPE:
                        message = `File ${operation} failed because type of "${subject}" file is not supported`;
                        break
                }
            }

            throw new FileTransferError(message || `File ${operation} of "${subject}" file failed due to error: ${(err.message || 'unknown error').toLowerCase()}`);
        }
    }
}

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';

export class FileTransferService {

    constructor(private readonly url: string, private readonly key: string) {
        this.url = url;
        this.key = key;
    }

    public async upload(evidence: Buffer, fileName: string): Promise<string> {

        if (evidence == null) {
            throw new Error('File is missing');
        }

        if (fileName == null) {
            throw new Error('File name is missing');
        }

        const data = new FormData();
        data.append('upload', evidence, fileName);

        const config: AxiosRequestConfig = {
            headers: {
                'x-api-key': this.key,
                ...data.getHeaders()
            }
        };

        console.log('Making a POST request to ' + this.url);

        return await axios
            .post(this.url, data, config)
            .then((response: AxiosResponse) => {
                if (response.status === CREATED && response.data.id) {
                    console.log('Evidence ID is: ' + response.data.id);
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

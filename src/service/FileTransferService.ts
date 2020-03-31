import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { CREATED } from 'http-status-codes';

export class FileTransferService {

    private readonly uri: string;

    constructor(private readonly host: string, private readonly key: string) {
        this.host = host;
        this.key = key;
        this.uri = `${this.host}/dev/files`;
    }

    public async upload(evidence: Buffer, fileName: string): Promise<string> {

        if (evidence == null) {
            throw new Error('Evidence file is missing');
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

        console.log('Making a POST request to ' + this.uri);

        return await axios
            .post(this.uri, data, config)
            .then((response: AxiosResponse) => {
                if (response.status === CREATED && response.data.id) {
                    console.log('Evidence ID is: ' + response.data.id);
                    return response.data.id;
                }
            });
    }
}

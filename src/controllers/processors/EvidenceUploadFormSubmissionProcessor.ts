import Busboy from 'busboy';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { Socket } from 'net';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { EvidenceUploadService } from 'app/service/EvidenceUploadService';

@provide(EvidenceUploadFormSubmissionProcessor)
export class EvidenceUploadFormSubmissionProcessor implements FormSubmissionProcessor {

    constructor(@inject(EvidenceUploadService) private readonly evidenceUploadService: EvidenceUploadService) {
    }

    async process(req: Request): Promise<void> {

        const id = '';

        console.log(req.headers['content-type']);

        const appeal: Appeal = req.session
            .chain(_ => _.getExtraData())
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .map(data => data.appeal)
            .unsafeCoerce();

        console.log(`Uploading file for company number: ${appeal.penaltyIdentifier.companyNumber}` +
            ` and penalty reference: ${appeal.penaltyIdentifier.penaltyReference}`);

        const maxSizeBytes: number = parseInt('4194304', 10);

        const chunkArray: Buffer[] = [];

        const busboy: busboy.Busboy = new Busboy({
            headers: req.headers,
            limits: {
                fileSize: maxSizeBytes,
            }
        });

        req.pipe(busboy);

        busboy.on('file',
            (fieldname: string, fileStream: Socket, filename: string, encoding: string, mimetype: string) => {

                console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding
                    + ', mimetype: ' + mimetype);

                fileStream.on('data', (data: Buffer) => {
                    console.log('File [' + fieldname + '] received ' + data.length + ' bytes for file' + filename);
                    chunkArray.push(data);
                });
                fileStream.on('end', async () => {
                    console.log('File [' + fieldname + '] Finished');
                    const fileData: Buffer = Buffer.concat(chunkArray);
                    try {
                        await this.evidenceUploadService.upload(fileData, filename);
                    } catch (err) {
                        console.log(err)
                    }

                });
            });

        busboy.on('finish', () => {
            console.log('Done parsing form!');
            // res.writeHead(303, {Connection: 'close', Location: '/'});
            // res.end();
        });
        req.pipe(busboy);

        await id;
    }
}

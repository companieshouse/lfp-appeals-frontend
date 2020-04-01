import Busboy from 'busboy';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { Socket } from 'net';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { FileTransferService } from 'app/service/FileTransferService';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

@provide(EvidenceUploadFormSubmissionProcessor)
export class EvidenceUploadFormSubmissionProcessor implements FormSubmissionProcessor {

    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
    }

    async process(req: Request): Promise<void> {

        const appeal: Appeal = req.session
            .chain(_ => _.getExtraData())
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .map(data => data.appeal)
            .unsafeCoerce();

        loggerInstance()
            .info(`${EvidenceUploadFormSubmissionProcessor.name} - process:
            Uploading file for company number: ${appeal.penaltyIdentifier.companyNumber}` +
                ` and penalty reference: ${appeal.penaltyIdentifier.penaltyReference}`);

        const maxSizeBytes: number = parseInt(getEnvOrDefault('MAX_FILE_SIZE_BYTES', ''), 10);

        const chunkArray: Buffer[] = [];

        const busboy: busboy.Busboy = new Busboy({
            headers: req.headers,
            limits: {
                fileSize: maxSizeBytes,
            }
        });

        req.pipe(busboy);

        await busboy.on('file',
            (fieldname: string, fileStream: Socket, filename: string, encoding: string, mimetype: string) => {


                loggerInstance().debug('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding
                    + ', mimetype: ' + mimetype);

                fileStream.on('data', (data: Buffer) => {
                    loggerInstance().debug('File [' + fieldname + '] received ' + data.length +
                        ' bytes for file' + filename);
                    chunkArray.push(data);
                });
                fileStream.on('end', async () => {
                    loggerInstance().debug('File [' + fieldname + '] Finished');
                    const fileData: Buffer = Buffer.concat(chunkArray);
                    await this.fileTransferService.upload(fileData, filename)
                        .catch((err) => {
                            console.log(err)
                        });
                });
            });

        await busboy.on('finish', () => {
            loggerInstance().debug('Done parsing form!');
            // res.writeHead(303, {Connection: 'close', Location: '/'});
            // res.end();
        });
    }
}

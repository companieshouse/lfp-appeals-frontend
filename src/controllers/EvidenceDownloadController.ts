import { FORBIDDEN } from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, requestParam } from 'inversify-express-utils';
import { Readable, Writable } from 'stream';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { FileMetadata } from 'app/modules/file-transfer-service/FileMetadata';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { FileNotReadyError } from 'app/modules/file-transfer-service/errors';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';
const template = 'download-file';
const errorCustomTemplate = 'error-custom';

@controller(DOWNLOAD_FILE_PAGE_URI, FileTransferFeatureMiddleware)
export class EvidenceDownloadController extends BaseAsyncHttpController {

    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super();
    }

    @httpGet('/prompt/:fileId')
    public renderPrompt(@requestParam('fileId') fileId: string): void {
        this.httpContext.response.render(template, { fileId });
    }

    @httpGet('/data/:fileId/download')
    public async download(@requestParam('fileId') fileId: string): Promise<void> {

        const res = this.httpContext.response;

        const metadata: FileMetadata = await this.fileTransferService.getFileMetadata(fileId);

        res.setHeader('content-disposition', `attachment; filename=${metadata.name}`);

        if (!metadata.av_status || metadata.av_status !== 'clean') {
            return this.renderDownloadError();
        }

        let readable: Readable;
        try {
            readable = await this.fileTransferService.download(fileId);
        } catch (err) {
            if (err instanceof FileNotReadyError) {
                return this.renderDownloadError();
            } else {
                throw err;
            }
        }
        return await this.pipeDataIntoStream(readable, res);
    }

    private async renderDownloadError(): Promise<void> {
        return this.renderWithStatus(FORBIDDEN)(errorCustomTemplate, {
            heading: 'The file can not be downloaded at this moment',
            message: 'Please try again later'
        });
    }

    private async pipeDataIntoStream(readable: Readable, writable: Writable): Promise<void> {

        return new Promise<void>((resolve, reject) => readable.pipe(writable)
            .on('finish', resolve)
            .on('error', reject));
    }

}

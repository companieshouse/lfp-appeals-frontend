import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { FORBIDDEN } from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, requestParam } from 'inversify-express-utils';
import { Readable, Writable } from 'stream';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileRestrictionsMiddleware } from 'app/middleware/FileRestrictionsMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { APPEAL_ID_QUERY_KEY, COMPANY_NUMBER_QUERY_KEY, LoadAppealMiddleware } from 'app/middleware/LoadAppealMiddleware';
import { FileMetadata } from 'app/modules/file-transfer-service/FileMetadata';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { FileNotReadyError } from 'app/modules/file-transfer-service/errors';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';

const template = 'download-file';
const errorCustomTemplate = 'error-custom';

@controller(DOWNLOAD_FILE_PAGE_URI,
    SessionMiddleware,
    AuthMiddleware,
    FileTransferFeatureMiddleware,
    LoadAppealMiddleware,
    FileRestrictionsMiddleware
)
export class EvidenceDownloadController extends BaseAsyncHttpController {

    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super();
    }

    @httpGet('/prompt/:fileId')
    public async renderPrompt(@requestParam('fileId') fileId: string): Promise<void> {
        return this.render(template, { downloadPath: this.getDownloadPath(this.httpContext.request, fileId) });
    }

    @httpGet('/data/:fileId/download')
    public async download(@requestParam('fileId') fileId: string): Promise<void> {

        const metadata: FileMetadata = await this.fileTransferService.getFileMetadata(fileId);

        if (!metadata.av_status || metadata.av_status !== 'clean') {
            return this.renderDownloadError();
        }

        return await this.downloadAttachment(metadata, this.httpContext.response);
    }

    private async downloadAttachment(metadata: FileMetadata, res: Response): Promise<void> {

        try {
            const downloadStream: Readable = await this.fileTransferService.download(metadata.id);
            res.setHeader('content-disposition', `attachment; filename=${metadata.name}`);
            return this.pipeDataIntoStream(downloadStream, res);

        } catch (err) {

            if (err instanceof FileNotReadyError) {
                return this.renderDownloadError();
            } else {
                throw err;
            }
        }
    }

    private getDownloadPath(req: Request, fileId: string): string {

        const appealId = req.query[APPEAL_ID_QUERY_KEY];
        const companyNumber = req.query[COMPANY_NUMBER_QUERY_KEY];

        if (!appealId && !companyNumber) {
            return '';
        }
        if (appealId && !companyNumber) {
            return `?a=${appealId}`;
        }
        if (!appealId) {
            return `?c=${companyNumber}`;
        }
        return `${fileId}/download?a=${appealId}&c=${companyNumber}`;
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

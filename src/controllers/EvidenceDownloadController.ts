import { inject } from 'inversify';
import { controller, httpGet, requestParam } from 'inversify-express-utils';
import { Readable, Writable } from 'stream';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';
const template = 'download-file';

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

        const metadata = await this.fileTransferService.getFileMetadata(fileId);
        res.setHeader('content-disposition', `attachment; filename=${metadata.name}`);

        const readable = await this.fileTransferService.download(fileId);

        return await this.pipeDataIntoStream(readable, res);

    }

    private async pipeDataIntoStream(readable: Readable, writable: Writable): Promise<void> {

        return new Promise<void>((resolve, reject) => readable.pipe(writable)
            .on('finish', resolve)
            .on('error', reject));
    }

}

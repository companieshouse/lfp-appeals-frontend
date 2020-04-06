import { inject } from 'inversify';
import { controller, httpGet, requestParam } from 'inversify-express-utils';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { FileTransferService } from 'app/service/FileTransferService';
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

        return await this.fileTransferService.download(fileId, res);

    }

}
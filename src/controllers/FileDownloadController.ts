import { Response } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, requestParam, response } from 'inversify-express-utils';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { loggerInstance } from 'app/middleware/Logger';
import { FileTransferService } from 'app/service/FileTransferService';
import { DOWNLOAD_FILE_URI } from 'app/utils/Paths';

const template = 'download-file';

@controller(DOWNLOAD_FILE_URI)
export class FileDownloadController extends BaseAsyncHttpController {

    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super();
    }

    @httpGet('/prompt/:fileId')
    public renderPrompt(@response() res: Response, @requestParam('fileId') fileId: string): void {
        res.render(template, { fileId });
    }

    @httpGet('/data/:fileId/download')
    public async download(@response() res: Response, @requestParam('fileId') fileId: string): Promise<void> {

        try {
            await this.fileTransferService.download(fileId, res);
            res.status(OK);
        } catch (err) {
            loggerInstance().error(`${err} - at - ${FileDownloadController.name}.download`);
            return await this.renderWithStatus(err.status)('error', { message: err.message });
        }

    }

}
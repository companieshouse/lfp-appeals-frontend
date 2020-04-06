import { AxiosResponse } from 'axios';
import { Response } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, requestParam } from 'inversify-express-utils';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

import { FileTransferService } from 'app/service/FileTransferService';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';

const template = 'download-file';

@controller(DOWNLOAD_FILE_PAGE_URI)
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

        return await this.fileTransferService.download(fileId, res, (axiosResponse: AxiosResponse<any>) => {
            this.setHeaders(res, axiosResponse);
        });

    }

    private setHeaders(res: Response, axiosResponse: AxiosResponse<any>): void {

        res.setHeader('Content-Type', axiosResponse.headers['content-length']);
        res.setHeader('Content-Length', axiosResponse.headers['content-length']);
        res.setHeader('Content-Disposition', axiosResponse.headers['content-disposition']);
        res.status(OK);

    }

}
import 'reflect-metadata';

import Substitute from '@fluffy-spoon/substitute';
import { AxiosResponse } from 'axios';
import { SessionStore } from 'ch-node-session-handler';
import { expect } from 'chai';
import { Response } from 'express';
import { GATEWAY_TIMEOUT, INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import { FileTransferService } from 'app/service/FileTransferService';
import { FileNotFoundError } from 'app/service/error/FileNotFoundError';
import { FileTransferServiceError } from 'app/service/error/FileTransferServiceError';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';

import { createAppConfigurable } from 'test/ApplicationFactory';

const createDefaultApp = (fileTransferService: FileTransferService) => createAppConfigurable(container => {
    container.bind(SessionStore).toConstantValue(Substitute.for<SessionStore>());
    container.bind(FileTransferService).toConstantValue(fileTransferService);
});
describe('EvidenceDownloadController', () => {
    const FILE_ID = '123';
    const DOWNLOAD_PROMPT_URL = `${DOWNLOAD_FILE_PAGE_URI}/prompt/${FILE_ID}`;
    const EXPECTED_DOWNLOAD_LINK_URL = `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download`;

    const contentDisposition = `attachment; filename=hello.txt`;
    const contentLength = 1000;
    const contentType = `application/json`;

    const createControllerDownloadCall = (response: Response, returnData: Promise<void>) => {
        response.setHeader('Content-Disposition', contentDisposition);
        response.setHeader('Content-Length', contentLength);
        response.setHeader('Content-Type', contentType);
        // @ts-ignore
        return async (fileId: string, stream: any, onStart: (axiosRes: AxiosResponse) => void) => {
            return returnData;
        };
    };

    const fileTransferServiceProxy = (response: Response, returnData: Promise<void>): FileTransferService => {
        return {
            download: createControllerDownloadCall(response, returnData)
        } as FileTransferService;
    };

    it('should render the prompt page correctly', async () => {


        const fileTransferService = Substitute.for<FileTransferService>();

        await request(createDefaultApp(fileTransferService))
            .get(DOWNLOAD_PROMPT_URL)
            .then(res => {
                expect(res.status).to.eq(200);
                expect(res.text).to.include(`href="${EXPECTED_DOWNLOAD_LINK_URL}"`);
            });

    });

    it('should start downloading the file when the file is valid', async () => {

        const mockResponse = Substitute.for<Response>();



        await request(createDefaultApp(fileTransferServiceProxy(mockResponse, Promise.resolve())))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.status).to.eq(204);
                mockResponse.received().setHeader('Content-Disposition', contentDisposition);
                mockResponse.received().setHeader('Content-Length', contentLength);
                mockResponse.received().setHeader('Content-Type', contentType);
            });

    });

    it('should render an error page when the file service fails to download file', () => {
        const randomReason = 'for some reason';
        const fileNotFoundError = new FileNotFoundError(FILE_ID);
        const fileDownloadError = new FileTransferServiceError(FILE_ID, INTERNAL_SERVER_ERROR, randomReason);
        const fileDownloadErrorGateway = new FileTransferServiceError(FILE_ID, GATEWAY_TIMEOUT, randomReason);


        const expectedErrors = [fileNotFoundError.message, fileDownloadError.message, fileDownloadErrorGateway.message, 'Sorry, there is a problem with the service'];
        let counter = 0;

        [NOT_FOUND, INTERNAL_SERVER_ERROR, GATEWAY_TIMEOUT, 0].forEach(async status => {

            const fileTransferService =
                fileTransferServiceProxy(Substitute.for<Response>(), Promise.reject(status));

            await request(createDefaultApp(fileTransferService))
                .get(EXPECTED_DOWNLOAD_LINK_URL)
                .then(res => {
                    expect(res.status).to.eq(status);
                    expect(res.text).to.contain(expectedErrors[counter++]);
                });
        });
    });
});

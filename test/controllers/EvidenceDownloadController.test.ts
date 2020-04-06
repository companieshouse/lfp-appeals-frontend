import 'reflect-metadata';

import Substitute from '@fluffy-spoon/substitute';
import { SessionStore } from 'ch-node-session-handler';
import { expect } from 'chai';
import { GATEWAY_TIMEOUT, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from 'http-status-codes';
import { Readable } from 'stream';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import { FileMetadata } from 'app/models/FileMetadata';
import { FileTransferService } from 'app/service/FileTransferService';
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


    const fileTransferServiceProxy = (
        downloadResult: Promise<Readable>,
        fileMetadatResult: Promise<FileMetadata>): FileTransferService => {
        return {
            // @ts-ignore
            download: async (fileId: string) => downloadResult,
            // @ts-ignore
            getFileMetadata: async (fileId: string) => fileMetadatResult
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

        const metadata: FileMetadata = {
            av_status: 'scanned',
            content_type: contentType,
            id: FILE_ID,
            name: 'hello.txt',
            size: contentLength
        };

        const fakeFileTransferProxy =
            fileTransferServiceProxy(Promise.resolve(Readable.from('')),
                Promise.resolve<FileMetadata>(metadata));

        await request(
            createDefaultApp(fakeFileTransferProxy))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.header['content-disposition']).eq(contentDisposition);
                expect(res.status).to.eq(OK);
            });

    });

    it('should render an error page when the file service fails to download file', () => {
        const fileNotFoundError = new Error(`File ${FILE_ID} not found.`);
        const fileDownloadError = new Error(`Some internal server error`);

        const expectedErrors = [fileNotFoundError.message, fileDownloadError.message, fileDownloadError.message, 'Sorry, there is a problem with the service'];

        const getBrokenFileTransferService =
            (status: number) =>
                fileTransferServiceProxy(
                    Promise.reject(status),
                    Promise.reject(status)
                );

        const testAppWith = async (fileTransferService: FileTransferService) => {
            let counter = 0;

            await request(createDefaultApp(fileTransferService))
                .get(EXPECTED_DOWNLOAD_LINK_URL)
                .then(res => {
                    expect(res.status).to.eq(status);
                    expect(res.text).to.contain(expectedErrors[counter++]);
                });

        };

        const statusFailureArray = [NOT_FOUND, INTERNAL_SERVER_ERROR, GATEWAY_TIMEOUT, 0];

        statusFailureArray.forEach(async status => {

            const fileTransferService = getBrokenFileTransferService(status);

            await testAppWith(fileTransferService);
        });
    });
});

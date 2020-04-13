import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { SessionStore } from 'ch-node-session-handler';
import { expect } from 'chai';
import { FORBIDDEN, GATEWAY_TIMEOUT, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from 'http-status-codes';
import { Readable } from 'stream';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import { FileMetadata } from 'app/modules/file-transfer-service/FileMetadata';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { FileNotReadyError } from 'app/modules/file-transfer-service/errors';
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

    const expectedDownloadErrorHeading = 'The file can not be downloaded at this moment';
    const expectedDownloadErrorMessage = 'Please try again later';

    const metadataClean: FileMetadata = {
        av_status: 'clean',
        content_type: contentType,
        id: FILE_ID,
        name: 'hello.txt',
        size: contentLength
    };

    const readable = new Readable();
    readable.push('');
    readable.push(null);

    const fileTransferServiceProxy = (downloadResult: Promise<Readable>,
                                      metadata: FileMetadata): FileTransferService => {

        const proxy = Substitute.for<FileTransferService>();
        // @ts-ignore
        proxy.download(Arg.any()).mimicks(async (fileId: string) => downloadResult);
        // @ts-ignore
        proxy.getFileMetadata(Arg.any()).mimicks(async (fileId: string) => Promise.resolve(metadata));
        return proxy;
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

        const fakeFileTransferProxy =
            fileTransferServiceProxy(Promise.resolve(readable), metadataClean);

        await request(
            createDefaultApp(fakeFileTransferProxy))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.header['content-disposition']).eq(contentDisposition);
                expect(res.status).to.eq(OK);
            });

    });

    it('should render an error page when the file service fails to download file', async () => {

        const expectedErrorMessage = 'Sorry, there is a problem with the service';

        const getBrokenFileTransferService =
            (fileDownloadStatus: number) => {
                const fileDownloadError = {
                    message: `An error with code ${fileDownloadStatus} occured`,
                    statusCode: fileDownloadStatus
                };
                return fileTransferServiceProxy(Promise.reject(fileDownloadError), metadataClean);
            };

        const testAppWith = async (fileTransferService: FileTransferService) => {

            await request(createDefaultApp(fileTransferService))
                .get(EXPECTED_DOWNLOAD_LINK_URL)
                .then(res => {
                    expect(res.text).to.contain(expectedErrorMessage);
                });

        };

        const statusFailureArray = [NOT_FOUND, INTERNAL_SERVER_ERROR, GATEWAY_TIMEOUT, 0];

        for (const fileDownloadStatus of statusFailureArray) {

            const fileTransferService = getBrokenFileTransferService(fileDownloadStatus);
            await testAppWith(fileTransferService);

        }

    });

    it('should render custom error page when the file service fails to download file with FileNotReady', async () => {

        const app = createDefaultApp(fileTransferServiceProxy(Promise.reject(
            new FileNotReadyError(`File download failed because "${FILE_ID}" file is either infected or has not been scanned yet`)),
            metadataClean));

        await request(app)
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.status).to.equal(FORBIDDEN);
                expect(res.text).to.contain(expectedDownloadErrorHeading);
                expect(res.text).to.contain(expectedDownloadErrorMessage);
            });
    });

    it('should render custom error page during download when the status is invalid', async () => {

        const createMetadata = (status: undefined | null | string): FileMetadata => {
            return {
                av_status: status as any,
                content_type: contentType,
                id: FILE_ID,
                name: 'hello.txt',
                size: contentLength
            };
        };

        for (const status of [undefined, null, 'infected', 'not-scanned']) {

            const app = createDefaultApp(fileTransferServiceProxy(Promise.resolve(readable), createMetadata(status)));

            await request(app)
                .get(EXPECTED_DOWNLOAD_LINK_URL)
                .then(res => {
                    expect(res.status).to.equal(FORBIDDEN);
                    expect(res.text).to.contain(expectedDownloadErrorHeading);
                    expect(res.text).to.contain(expectedDownloadErrorMessage);
                });
        }
    });

});

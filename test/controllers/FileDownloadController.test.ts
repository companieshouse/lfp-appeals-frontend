import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { SessionStore } from 'ch-node-session-handler';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/FileDownloadController';
import { FileTransferService } from 'app/service/FileTransferService';
import { FileDownloadError } from 'app/service/error/FileDownloadError';
import { FileNotFoundError } from 'app/service/error/FileNotFoundError';
import { DOWNLOAD_FILE_URI } from 'app/utils/Paths';

import { createAppConfigurable } from 'test/ApplicationFactory';

const createDefaultApp = (fileTransferService: FileTransferService) => createAppConfigurable(container => {
    container.bind(SessionStore).toConstantValue(Substitute.for<SessionStore>());
    container.bind(FileTransferService).toConstantValue(fileTransferService);
});
describe('FileDownloadController', () => {
    const FILE_ID = '123';
    const DOWNLOAD_PROMPT_URL = `${DOWNLOAD_FILE_URI}/prompt/${FILE_ID}`;
    const EXPECTED_DOWNLOAD_LINK_URL = `${DOWNLOAD_FILE_URI}/data/${FILE_ID}/download`;

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

        const fileTransferService = Substitute.for<FileTransferService>();
        fileTransferService.download(FILE_ID, Arg.any()).returns(Promise.resolve());

        await request(createDefaultApp(fileTransferService))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.status).to.eq(204);
            });

    });

    it('should render an error page when the file service fails to download file', async () => {
        let fileTransferService = Substitute.for<FileTransferService>();
        const randomReason = 'for some reason';
        const fileNotFoundError = new FileNotFoundError(FILE_ID);
        const fileDownloadError = new FileDownloadError(FILE_ID, randomReason);

        fileTransferService.download(FILE_ID, Arg.any()).returns(Promise.reject(fileNotFoundError));

        await request(createDefaultApp(fileTransferService))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.status).to.eq(NOT_FOUND);
                expect(res.text).to.contain(fileNotFoundError.message);
            });

        fileTransferService = Substitute.for<FileTransferService>();
        fileTransferService.download(FILE_ID, Arg.any()).returns(Promise.reject(fileDownloadError));

        await request(createDefaultApp(fileTransferService))
            .get(EXPECTED_DOWNLOAD_LINK_URL)
            .then(res => {
                expect(res.status).to.eq(INTERNAL_SERVER_ERROR);
                expect(res.text).to.contain(fileDownloadError.message);
            });
    });
});

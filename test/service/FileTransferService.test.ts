import Substitute from '@fluffy-spoon/substitute';
import { assert, expect } from 'chai';
import { Response } from 'express';
import * as Fs from 'fs';
import { CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import nock = require('nock');
import { promisify } from 'util';

import { FileMetadata } from 'app/models/FileMetadata';
import { FileTransferService } from 'app/service/FileTransferService';
import { FileNotFoundError } from 'app/service/error/FileNotFoundError';
import { FileTransferServiceError } from 'app/service/error/FileTransferServiceError';

describe('FileTransferService', () => {

    const KEY: string = 'mock-key';
    const HOST: string = 'http://localhost';
    const URI: string = '/dev/files';
    const fileTransferService = new FileTransferService(HOST + URI, KEY);
    const createGetNockRequest = (url: string) => nock(HOST)
        .get(url, {}, {
            reqheaders: { 'x-api-key': KEY }
        });
    const fileID = 'someId';
    const expectedMetada: FileMetadata = {
        av_status: 'scanned',
        content_type: 'application/txt',
        id: fileID,
        name: 'hello.txt',
        size: 100
    };
    describe('upload file', () => {

        it('should throw an error when evidence not defined', () => {

            [undefined, null].forEach(async evidence => {
                try {
                    await fileTransferService.upload(evidence!, 'filename');
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File is missing');
                }
            });
        });

        it('should throw an error when file name not defined', () => {

            [undefined, null].forEach(async filename => {
                try {
                    await fileTransferService.upload(Buffer.from('This is a test'), filename!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File name is missing');
                }
            });
        });

        it('should return file ID when supported media uploaded', async () => {

            const evidenceID: string = 'mock-id';

            nock(HOST)
                .post(URI,
                    new RegExp(`form-data; name="upload"; filename="test.supported"`, 'm'),
                    {
                        reqheaders: {
                            'x-api-key': KEY
                        },
                    }
                )
                .reply(CREATED, { id: evidenceID });

            const response = await fileTransferService.upload(Buffer.from('This is a test'), 'test.supported');
            expect(response).to.equal(evidenceID);
        });

        it('should throw error when unsupported media uploaded', async () => {

            nock(HOST)
                .post(URI,
                    new RegExp(`form-data; name="upload"; filename="test.not_supported"`, 'm'),
                    {
                        reqheaders: {
                            'x-api-key': KEY
                        },
                    }
                )
                .replyWithError({
                    message: { message: 'unsupported file type' },
                    code: UNSUPPORTED_MEDIA_TYPE,
                });

            try {
                await fileTransferService.upload(Buffer.from('This is a test'), 'test.not_supported');
            } catch (err) {
                expect(err.message).to.contain('Unsupported file type');
            }
        });
    });

    describe('File Metadata', () => {

        const fileMetadaUrl = `${URI}/${fileID}`;

        it('should throw an error if the axios request fails', async () => {

            createGetNockRequest(fileMetadaUrl).reply(404);

            try {
                await fileTransferService.getFileMetadata(fileID);
            } catch (err) {
                expect(err.constructor.name).to.eq(FileNotFoundError.name);
            }

        });
        it('should get file metada if it exists', async () => {

            createGetNockRequest(fileMetadaUrl).reply(200, expectedMetada);

            await fileTransferService.getFileMetadata(fileID).then(_ => assert.deepEqual(_, expectedMetada));
        });
    });

    describe('Download a file', async () => {
        const readFile = promisify(Fs.readFile);

        const fileToStream = 'package.json';
        const fileToStreamPath = `./${fileToStream}`;
        const downloadFileName = 'hello.txt';
        const downloadedDirPath = `./test`;
        const downloadedFilePath = `${downloadedDirPath}/${downloadFileName}`;
        const downloadUrl = `${URI}/${fileID}/download`;
        const fileDataBuffer = Fs.createReadStream(fileToStream);

        const expectedBufferString = await readFile(fileToStreamPath);

        const contentDisposition = `attachment; filename=${downloadFileName}`;
        const contentLength = `${expectedBufferString.byteLength}`;
        const contentType = `application/json`;

        const createDownloadRequest = () => createGetNockRequest(downloadUrl).reply(200, fileDataBuffer, {
            'content-disposition': contentDisposition,
            'content-length': contentLength,
            'content-type': contentType
        });

        it('should throw appropriate errors if the file does not exist', () => {

            const expectedErrors = [FileNotFoundError.name, FileTransferServiceError.name, Error.name];
            let counter = 0;

            [NOT_FOUND, INTERNAL_SERVER_ERROR, 0].forEach(async status => {
                createGetNockRequest(downloadUrl).reply(status);
                try {
                    await fileTransferService.download(fileID, Substitute.for<Response>());
                } catch (err) {
                    expect(err.contructor.name).to.eq(expectedErrors[counter++]);
                }
            });


        });

        it('should return the 200 and put the correct file content into the response object', async () => {
            createDownloadRequest();

            await fileTransferService.download(fileID, Fs.createWriteStream(downloadedFilePath));
            const receivedBufferString = await readFile(downloadedFilePath);
            expect(receivedBufferString).to.deep.eq(expectedBufferString);
            Fs.unlinkSync(downloadedFilePath);

        });

    });
});

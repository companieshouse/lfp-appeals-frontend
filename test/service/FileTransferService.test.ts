import Substitute from '@fluffy-spoon/substitute';
import { assert, expect } from 'chai';
import { Response } from 'express';
import * as Fs from 'fs';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import nock = require('nock');
import { promisify } from 'util';

import { FileMetada } from 'app/models/FileMetada';
import { FileTransferService } from 'app/service/FileTransferService';
import { FileDownloadError } from 'app/service/error/FileDownloadError';
import { FileNotFoundError } from 'app/service/error/FileNotFoundError';

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
    const expectedMetada: FileMetada = {
        av_status: 'scanned',
        content_type: 'application/txt',
        id: fileID,
        links: { download: '', self: '' },
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
                await fileTransferService.fileMetada(fileID);
            } catch (err) {
                expect(err.name).to.eq(FileNotFoundError.name);
            }

        });
        it('should get file metada if it exists', async () => {

            createGetNockRequest(fileMetadaUrl).reply(200, expectedMetada);

            await fileTransferService.fileMetada(fileID).then(_ => assert.deepEqual(_, expectedMetada));
        });
    });

    describe('Download a file', () => {
        const fileToStream = 'package.json';
        const fileToStreamPath = `./${fileToStream}`;
        const downloadFileName = 'hello.txt';
        const downloadedDirPath = `./test`;
        const downloadedFilePath = `${downloadedDirPath}/${downloadFileName}`;
        const downloadUrl = `${URI}/${fileID}/download`;
        const fileDataBuffer = Fs.createReadStream(fileToStream);

        const mockResponse = Substitute.for<Response>();

        it('should throw an error if the file does not exist', async () => {

            createGetNockRequest(downloadUrl).reply(404);

            try {
                await fileTransferService.download(fileID, mockResponse);
            } catch (err) {
                expect(err.name).to.eq(FileDownloadError.name);
            }
        });

        it('should return the 200 and put the correct file content into the response object', async () => {

            createGetNockRequest(downloadUrl).reply(200, fileDataBuffer, {
                'content-disposition': `attachment; filename=${downloadFileName}`
            });

            const readFile = promisify(Fs.readFile);



            await fileTransferService.download(fileID, Fs.createWriteStream(downloadedFilePath));
            const receivedBufferString = await readFile(downloadedFilePath);
            const expectedBufferString = await readFile(fileToStreamPath);
            expect(receivedBufferString).to.deep.eq(expectedBufferString);


        });

        after(() => {
            Fs.unlinkSync(downloadedFilePath);
        });
    });
});

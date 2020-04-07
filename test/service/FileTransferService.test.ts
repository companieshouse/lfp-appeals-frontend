import * as assert from 'assert';
import { expect } from 'chai';
import { CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from 'http-status-codes';
import nock = require('nock');
import { Readable, Writable} from 'stream';

import { FileMetadata } from 'app/models/FileMetadata';
import { FileTransferService } from 'app/service/FileTransferService';

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
    const expectedMetadata: FileMetadata = {
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
    });

    describe('get file metadata', () => {

        const fileMetadataUrl = `${URI}/${fileID}`;

        it('should throw an error when no fileId is provided', () => {
            [undefined, null].forEach(async fileId => {
                try {
                    await fileTransferService.getFileMetadata(fileId!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File ID is missing');
                }
            });
        });

        it('should throw an error if the axios request fails', async () => {

            createGetNockRequest(fileMetadataUrl).reply(NOT_FOUND);

            try {
                await fileTransferService.getFileMetadata(fileID);
            } catch (err) {
                expect(err.message).to.include(`File ${fileID} not found`);
            }

        });

        it('should get file metadata if it exists', async () => {

            createGetNockRequest(fileMetadataUrl).reply(OK, expectedMetadata);
            const fileMetadata = await fileTransferService.getFileMetadata(fileID);
            expect(fileMetadata).to.deep.eq(expectedMetadata);

        });
    });

    describe('download file', () => {
        const inputText = 'This is some random text that will be converted to a buffer';
        const fileDataBuffer = new Readable();
        fileDataBuffer.push(inputText);
        fileDataBuffer.push(null);

        const downloadFileName = 'hello.txt';
        const contentDisposition = `attachment; filename=${downloadFileName}`;

        const downloadUrl = `${URI}/${fileID}/download`;

        const createDownloadRequest = () => createGetNockRequest(downloadUrl).reply(OK, fileDataBuffer, {
            'content-disposition': contentDisposition,
        });

        it('should throw an error when no fileId is provided', () => {
            [undefined, null].forEach(async fileId => {
                try {
                    await fileTransferService.download(fileId!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File ID is missing');
                }
            });
        });

        it('should throw appropriate errors if the file does not exist', () => {

            const expectedErrors = [`File ${fileID} not found`, Error.name, Error.name];
            let counter = 0;

            [NOT_FOUND, INTERNAL_SERVER_ERROR, 0].forEach(async status => {
                createGetNockRequest(downloadUrl).replyWithError(new Error(`${status}`));

                await fileTransferService.download(fileID)
                    .catch(err => expect(err.message).to.include(expectedErrors[counter++]));

            });


        });

        it('should return the 200 and put the correct file content into the response object', async () => {

            createDownloadRequest();
            const chunks: any[] = [];

            const writable = new Writable();

            writable._write = (chunk: any,
                // @ts-ignore
                encoding: string,
                callback: (error?: Error | null | undefined) => void): void => {

                chunks.push(chunk);
                callback();
            };

            const readable = await fileTransferService.download(fileID);

            await new Promise((res, rej) => readable.pipe(writable).on('finish', res).on('error', rej));

            const result = Buffer.concat(chunks).toString();
            expect(result).to.eq(inputText);

        });

    });

    describe('delete file', () => {
        it('should throw an error when file ID is not defined', () => {

            [undefined, null].forEach(async evidence => {
                try {
                    await fileTransferService.delete(evidence!)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File ID is missing')
                }
            })
        });

        it('should throw an error when file does not exist', async () => {

            const fileId = 'non-existing-file';

            nock(HOST)
                .delete(`${URI}/${fileId}`)
                .reply(404, {
                    message: 'file not found'
                });

            try {
                await fileTransferService.delete(fileId);
                assert.fail('Test should failed while it did not')
            } catch (err) {
                expect(err.message).to.contain(`File ${fileId} cannot be deleted because it does not exist`);
            }
        });

        it('should throw an error when file deletion failed', async () => {

            const fileId = 'malformed-file';

            nock(HOST)
                .delete(`${URI}/${fileId}`)
                .reply(500, {
                    message: 'failed to delete file'
                });

            try {
                await fileTransferService.delete(fileId);
                assert.fail('Test should failed while it did not')
            } catch (err) {
                expect(err.message).to.contain(`File ${fileId} cannot be deleted due to error: request failed with status code 500`);
            }
        });

        it('should return nothing when file deletion succeeded', async () => {

            const fileId = 'existing-file';

            nock(HOST)
                .delete(`${URI}/${fileId}`)
                .reply(204);

            const result = await fileTransferService.delete(fileId);
            // tslint:disable-next-line: no-unused-expression
            expect(result).is.undefined
        })
    })
});

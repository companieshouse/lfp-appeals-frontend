import * as assert from 'assert';
import { expect } from 'chai';
import { CREATED, UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
import nock = require('nock');

import { FileTransferService } from 'app/service/FileTransferService'

describe('FileTransferService', () => {

    const KEY: string = 'mock-key';
    const HOST: string = 'http://localhost';
    const URI: string = '/dev/files';
    const fileTransferService = new FileTransferService(HOST + URI , KEY);

    describe('upload file', () => {

        it('should throw an error when evidence not defined', () => {

            [undefined, null].forEach(async evidence => {
                try {
                    await fileTransferService.upload(evidence!, 'filename')
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File is missing')
                }
            })
        });

        it('should throw an error when file name not defined', () => {

            [undefined, null].forEach(async filename => {
                try {
                    await fileTransferService.upload(Buffer.from('This is a test'), filename!)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File name is missing')
                }
            })
        });

        it('should return file ID when supported media uploaded', async () => {

            const evidenceID: string = 'mock-id';

            nock(HOST)
                .post(URI,
                    new RegExp(`form-data; name="upload"; filename="test.supported"`,'m'),
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
                    new RegExp(`form-data; name="upload"; filename="test.not_supported"`,'m'),
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
            } catch(err) {
                expect(err.message).to.contain('Unsupported file type');
            }
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

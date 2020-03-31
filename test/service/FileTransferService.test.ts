import { assert, expect } from 'chai';
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

    describe('File Metadata', () => {
        // const validId = 'someId';
        const expectedBuffer = Buffer.from('hello');
        const filename = 'hello.txt'

        before(async () => await fileTransferService.upload(expectedBuffer, filename))

        it('should throw an error if the axios request fails', async () => {


            nock(HOST).post(URI, {}, {
                reqheaders: { 'x-api-key': KEY }
            }).reply(404)

            await fileTransferService.download('').then(_ => assert.fail())
        })
    });

    describe('Donwload a file', () => {
        it('should throw an error if the')
    })
});

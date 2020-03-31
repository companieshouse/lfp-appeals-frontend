import { expect } from 'chai';
import { UNSUPPORTED_MEDIA_TYPE } from 'http-status-codes';
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
                        .and.to.haveOwnProperty('message').equal('Evidence file is missing')
                }
            })
        });

        it('should throw an error when file name not defined', () => {

            const evidence: Buffer = Buffer.from('This is a test');

            [undefined, null].forEach(async filename => {
                try {
                    await fileTransferService.upload(evidence as Buffer, filename!)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('File name is missing')
                }
            })
        });

        it('should return 201 status code when evidence uploaded', async () => {

            const EVIDENCE_ID: string = 'mock-id';
            const evidence: Buffer = Buffer.from('This is a test');

            nock(HOST)
                .post(URI,
                    new RegExp(`form-data; name="upload";[^]*${evidence}`,'m'),
                    {
                        reqheaders: {
                            'x-api-key': KEY
                        },
                    }
                )
                .reply(201, {id: EVIDENCE_ID});

            const response = await fileTransferService.upload(evidence, 'test.supported');
            expect(response).to.equal(EVIDENCE_ID);
        });

        it('should return 415 status code when unsupported medium uploaded', async () => {

            const evidence: Buffer = Buffer.from('This is a test');

            nock(HOST)
                .post(URI,
                    new RegExp(`form-data; name="upload";[^]*${evidence}`,'m'),
                    {
                        reqheaders: {
                            'x-api-key': KEY
                        },
                    }
                )
                .replyWithError({
                    message: {'message': 'unsupported file type'},
                    code: 415,
                });

            try{
                await fileTransferService.upload(evidence, 'test.not_supported');
            } catch(err){
                expect(err.code).to.be.equal(UNSUPPORTED_MEDIA_TYPE);
                expect(err.message).to.contain({'message': 'unsupported file type'});
            }
        });
    });
});

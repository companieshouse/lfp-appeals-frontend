import { expect } from 'chai';
import nock = require('nock');

import { FileTransferService } from 'app/service/FileTransferService'

describe('FileTransferService', () => {

    const KEY: string = 'mock-key';
    const HOST: string = 'http://localhost';
    const URI: string = '/dev/files';
    const evidenceUploadService = new FileTransferService(HOST + URI , KEY);

    describe('upload file', () => {

        it('should throw an error when evidence not defined', () => {

            [undefined, null].forEach(async evidence => {
                try {
                    await evidenceUploadService.upload(evidence!, 'filename')
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
                    await evidenceUploadService.upload(evidence as Buffer, filename!)
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
                    new RegExp(`form-data; name="upload"[^]*${evidence}`,'m'),
                    {
                        reqheaders: {
                            'x-api-key': KEY
                        },
                    }
                )
                .reply(201, {id: EVIDENCE_ID});

            const response = await evidenceUploadService.upload(evidence, 'test.pdf');
            expect(response).to.equal(EVIDENCE_ID);
        });
    });
});

import { expect } from 'chai';
import FormData from 'form-data';
import nock = require('nock');

import { EvidenceUploadService } from 'app/service/EvidenceUploadService'

describe('EvidenceUploadService', () => {

    const KEY: string = 'mockKey';
    const HOST: string = 'http://localhost';
    const evidenceUploadService = new EvidenceUploadService(HOST , KEY);

    describe('upload file', () => {
        const URI: string = '/dev/files';

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

            const EVIDENCE_ID: string = 'Mock ID';
            const evidence: Buffer = Buffer.from('This is a test');

            const data = new FormData();
            data.append('upload', evidence, {filename: 'test'});

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


            await evidenceUploadService.upload(evidence, 'test')
                .then((response) => {
                    expect(response).to.equal(EVIDENCE_ID);
                })
        });
    });
});

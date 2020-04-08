import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import { Session } from 'ch-node-session-handler';
import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from 'http-status-codes';
import request from 'supertest';
import supertest from 'supertest';

import 'app/controllers/EvidenceUploadController'
import { Appeal } from 'app/models/Appeal';
import { APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { UnsupportedFileTypeError } from 'app/modules/file-transfer-service/errors';
import { EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const pageHeading = 'Add documents to support your application';

const appealNoAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    },
    reasons: {
        other: {
            title: 'I have reasons',
            description: 'they are legit',
        }
    }
};

const appealWithAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    },
    reasons: {
        other: {
            title: 'I have reasons',
            description: 'they are legit',
            attachments: [
                {
                    name: 'some-file.jpeg'
                } as Attachment,
                {
                    name: 'another-file.jpeg'
                } as Attachment
            ]
        }
    }
};

const appealWithMaxAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    },
    reasons: {
        other: {
            title: 'I have reasons',
            description: 'they are legit',
            attachments: Array(10).fill({name: 'some-file.jpeg'} as Attachment)
        }
    }
};

const createSessionWithAppeal = (appeal: Appeal): Session => {
    const config = getDefaultConfig();
    return createFakeSession([], config.cookieSecret, true)
        .saveExtraData(APPLICATION_DATA_KEY, { appeal });
};

describe('EvidenceUploadController', () => {

    describe('GET request', () => {

        it('should return 200 when trying to access the evidence-upload page', async () => {

            const app = createApp(createSessionWithAppeal(appealNoAttachments));

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                });
        });

        it('should return 200 when trying to access page with attachments in session', async () => {

            const app = createApp(createSessionWithAppeal(appealWithAttachments));

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect((response: supertest.Response) => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain('some-file.jpeg')
                        .and.to.contain('another-file.jpeg');
                });
        });
    });

    describe('POST request: continue', () => {

        it('on continue should redirect to evidence upload page when files have been uploaded', async () => {

            const app = createApp(createSessionWithAppeal(appealWithAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('?')
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                })
        });

        it('on continue should return error when no files have been uploaded', async () => {

            const app = createApp(createSessionWithAppeal(appealNoAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('?')
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('There was a problem')
                        .and.to.contain('You must add a document or click “Continue without adding documents”');
                })
        });
    });

    describe('POST request: action=upload-file', () => {

        const buffer = Buffer.from('test data');
        const FILE_NAME: string = 'test-file.jpg';
        const UPLOAD_FILE_ACTION: string = 'upload-file';

        it('should return 302 and redirect to evidence upload page if no file chosen', async () => {

            const app = createApp(createSessionWithAppeal(appealNoAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                });
        });

        it('should return 302 and redirect to evidence upload page after successful upload', async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.resolve('123'));
            });

            const app = createApp(createSessionWithAppeal(appealWithAttachments), container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it('should return 422 when unsupported media uploaded', async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.reject(new UnsupportedFileTypeError(
                    `File upload failed because type of "${FILE_NAME}" file is not supported`)));
            });

            const app = createApp(createSessionWithAppeal(appealWithAttachments), container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('There was a problem')
                        .and.to.contain('The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it('should return 500 after failed upload', async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.reject(new Error('Unexpected error')));
            });

            const app = createApp(createSessionWithAppeal(appealNoAttachments), container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain('Sorry, there is a problem with the service');
                });
            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it('should return 500 if no appeal in session', async () => {

            const app = createApp(createSessionWithAppeal(undefined as any));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain('Sorry, there is a problem with the service');
                });
        });

        it('should return validation error if file not supported', async () => {

            const unsupportedFileName = 'test-file.fake';

            const app = createApp(createSessionWithAppeal(appealNoAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .attach('file', buffer, {filename: unsupportedFileName, contentType: 'application/zip'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                });
        });

        it('should return validation error when more than 10 files uploaded', async () => {

            const app = createApp(createSessionWithAppeal(appealWithMaxAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You can only select up to 10 files at the same time');
                });
        });

        it('should return validation error if too large of a file has been uploaded', async () => {

            const largeBuffer = Buffer.alloc(5000000);

            const app = createApp(createSessionWithAppeal(appealNoAttachments));

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', largeBuffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('File size must be smaller than 4MB');
                });
        });
    });
});

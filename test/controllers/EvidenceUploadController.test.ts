import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY,
    UNSUPPORTED_MEDIA_TYPE
} from 'http-status-codes';
import request from 'supertest';
import supertest from 'supertest';

import 'app/controllers/EvidenceUploadController'
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Navigation } from 'app/models/Navigation';
import { FileTransferService } from 'app/service/FileTransferService';
import { EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const config = getDefaultConfig();

const navigation: Navigation = {
    permissions: [EVIDENCE_UPLOAD_PAGE_URI]
};

const pageHeading = 'Add documents to support your application';

const appeal: Appeal = {
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

describe('EvidenceUploadController', () => {

    describe('GET request', () => {

        it('should return 200 when trying to access the evidence-upload page', async () => {

            const applicationData: Partial<ApplicationData> = { navigation };

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);
            const app = createApp(session);

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                });
        });

        it('should return 200 when trying to access page with session data', async () => {

            const applicationData: ApplicationData = { appeal: appealWithAttachments, navigation };

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);
            const app = createApp(session);

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect((response: supertest.Response) => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain('some-file.jpeg')
                        .and.to.contain('another-file.jpeg');
                });
        });
    });

    describe('POST request: action=upload-file-continue', () => {

        const UPLOAD_FILE_CONTINUE_ACTION: string = 'upload-file-continue';

        it('on continue should redirect to evidence upload page when files have been uploaded', async () => {

            const applicationData: ApplicationData = { appeal: appealWithAttachments, navigation };

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);

            const app = createApp(session);

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_CONTINUE_ACTION)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                })
        });

        it('on continue should return error when no files have been uploaded', async () => {

            const applicationData: ApplicationData = { appeal, navigation };

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);

            const app = createApp(session);

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_CONTINUE_ACTION)
                .expect(response => {
                    console.log(response);
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('There was a problem')
                        .and.to.contain('“Continue without adding documents”');
                })
        });
    });

    describe('POST request: action=upload-file', () => {

        let applicationData: ApplicationData = { appeal, navigation };

        let session = createFakeSession([], config.cookieSecret, true)
            .saveExtraData(APPLICATION_DATA_KEY, applicationData);

        const fileTransferService = createSubstituteOf<FileTransferService>(service => {
            service.upload(Arg.any()).returns(Promise.resolve('123'));
        });

        const buffer = Buffer.from('test data');

        const FILE_NAME: string = 'test-file.jpg';
        const UPLOAD_FILE_ACTION: string = 'upload-file';

        it('should return 302 and redirect to evidence upload page if no file chosen', async () => {

            const app = createApp(session);

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                })
        });

        it('should return 302 and redirect to evidence upload page after successful upload', async () => {

            const app = createApp(session, container => {
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

            const app = createApp(session, container => {

                container.rebind(FileTransferService)
                    .toConstantValue(createSubstituteOf<FileTransferService>(service => {
                        service.upload(Arg.any(), Arg.any())
                            .returns(Promise.reject({
                                message: { message: 'unsupported file type' },
                                code: UNSUPPORTED_MEDIA_TYPE,
                            }));
                    }));
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, { filename: FILE_NAME, contentType: 'unsupported' })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain('There was a problem')
                        .and.to.contain('The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                });
        });


        it('should return 500 after failed upload', async () => {

            const app = createApp(session, container => {

                container.rebind(FileTransferService)
                    .toConstantValue(createSubstituteOf<FileTransferService>(service => {
                        service.upload(Arg.any(), Arg.any())
                            .returns(Promise.reject(Error('Unexpected error')));
                    }));
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain('Sorry, there is a problem with the service');
                });
        });

        it('should return 500 if no appeal in session', async () => {

            applicationData = { navigation } as ApplicationData;

            session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', applicationData);

            const app = createApp(session, container => {
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

        it('should return validation error if file not supported', async () => {

            const unsupportedFileName = 'test-file.zip';

            const app = createApp(session, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .attach('file', buffer, {filename: unsupportedFileName , contentType: 'application/zip'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                });

            fileTransferService.didNotReceive().upload(Arg.any(), unsupportedFileName);
        });

        it('should return validation error when more than 10 files uploaded', async () => {


            applicationData = { appeal: appealWithMaxAttachments, navigation };

            session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);

            const app = createApp(session, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .attach('file', buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You can only select up to 10 files at the same time');
                });

        });

        it('should return ERROR if large file has been uploaded', async () => {
            const largeBuffer = Buffer.alloc(5000000);

            const app = createApp(session, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=' + UPLOAD_FILE_ACTION)
                .attach('file', largeBuffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('File size must be smaller than 4MB');
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });
    });
});

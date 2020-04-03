import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
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

describe('EvidenceUploadController', () => {

    describe('GET request', () => {

        const appeal: Appeal = {
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

        it('should return 200 when trying to access the evidence-upload page', async () => {

            const applicationData = {navigation} as ApplicationData;

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);
            const app = createApp(session);

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                });
        });


        it('should return 200 when trying to access page with session data', async () => {

            const applicationData: ApplicationData = {appeal, navigation};

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

    describe('POST request', () => {

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

        const applicationData: ApplicationData = { appeal, navigation };

        const session = createFakeSession([], config.cookieSecret, true)
            .saveExtraData(APPLICATION_DATA_KEY, applicationData);


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

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any()).returns(Promise.resolve('123'));
            });

            const app = createApp(session, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            const FILE_NAME: string = 'test-file.txt';

            await request(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query('action=upload-file')
                .attach('file', `test/files/${FILE_NAME}`)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });
    });
});

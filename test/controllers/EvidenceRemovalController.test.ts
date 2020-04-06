import 'reflect-metadata'
// tslint:disable-next-line: ordered-imports
import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';

loadEnvironmentVariablesFromFiles();
import { Session } from 'ch-node-session-handler';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EvidenceRemovalController'
import { Appeal } from 'app/models/Appeal';
import { APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { EVIDENCE_REMOVAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { SubstituteOf } from '@fluffy-spoon/substitute';
import { FileTransferService } from 'app/service/FileTransferService';
import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const createAppealWithAttachments = (attachments: Attachment[]): Appeal => {
    return {
        penaltyIdentifier: {
            companyNumber: '00345567',
            penaltyReference: 'A00000001',
        },
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'They are legit',
                attachments
            }
        }
    };
};

const createSessionWithAppeal = (appeal: Appeal): Session => {
    const config = getDefaultConfig();
    return createFakeSession([], config.cookieSecret, true)
        .saveExtraData(APPLICATION_DATA_KEY, { appeal });
};

describe('EvidenceRemovalController', () => {
    const attachment = { id: '123', name: 'note.txt' } as Attachment;

    describe('GET request', () => {
        it('should return 500 when file identifier is missing', async () => {
            const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=`)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                });
        });

        it('should return 500 when file identifier does not exist in session', async () => {
            const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=456`)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                });
        });

        it('should return 200 with file name when file identifier exists in session', async () => {
            const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=${attachment.id}`)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(`Are you sure you want to remove ${attachment.name}?`);
                });
        });
    });

    describe('POST request', () => {
        it('should render errors when no answer was provided', async () => {
            const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

            await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                .send({ fileId: attachment.id, fileName: attachment.name })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(`Are you sure you want to remove ${attachment.name}?`)
                        .and.to.include('There is an error on the page')
                        .and.to.include('You must tell us if you want to remove the document');
                });
        });

        describe('when answer is NO', () => {
            it('should redirect to file upload page', async () => {
                const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: 'false' })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI)
                    });
            });
        });

        describe('when answer is YES', () => {
            it('should return 500 when file identifier is missing', async () => {
                const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: 'true' })
                    .expect(response => {
                        expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    });
            });

            it('should return 500 when file identifier does not exist in session', async () => {
                const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])));

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: 'true', fileId: '456' })
                    .expect(response => {
                        expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    });
            });

            it('should redirect to file upload page when file identifier exists in session', async () => {
                const service: SubstituteOf<FileTransferService> = createSubstituteOf<FileTransferService>();

                const app = createApp(createSessionWithAppeal(createAppealWithAttachments([attachment])), container => {
                    container.rebind(FileTransferService).toConstantValue(service);
                });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: 'true', fileId: attachment.id })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI)
                    });

                service.received().delete(attachment.id);
            });
        })
    });
});

import 'reflect-metadata';

import { SubstituteOf } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EvidenceRemovalController';
import { Appeal } from 'app/models/Appeal';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { EVIDENCE_REMOVAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

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

describe('EvidenceRemovalController', () => {
    const attachment = { id: '123', name: 'note.txt' } as Attachment;

    describe('GET request', () => {

        it('should return 500 when file identifier is missing', async () => {
            const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=`)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                });
        });

        it('should return 500 when file identifier does not exist in session', async () => {
            const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=456`)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                });
        });

        it('should return 200 with file name when file identifier exists in session', async () => {
            const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}?f=${attachment.id}`)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(`Are you sure you want to remove ${attachment.name}?`);
                });
        });

        it('should return 200 with rendered back button in change mode', async () => {
            const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

            await request(app).get(`${EVIDENCE_REMOVAL_PAGE_URI}`)
                .query(`f=${attachment.id}`)
                .query('cm=1')
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(`Are you sure you want to remove ${attachment.name}?`).and
                        .to.include('href="/appeal-a-penalty/evidence-upload?cm=1"')
                        .nested.includes('Back');
                });
        });
    });

    describe('POST request', () => {
        it('should render errors when no answer was provided', async () => {
            const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

            await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                .send({ id: attachment.id, name: attachment.name })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(`Are you sure you want to remove ${attachment.name}?`)
                        .and.to.include('There is a problem')
                        .and.to.include('You must tell us if you want to remove the document');
                });
        });

        describe('when answer is NO', () => {
            it('should redirect to file upload page', async () => {
                const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: YesNo.no })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                    });
            });

            it('should redirect to file upload page in change mode', async () => {
                const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .query('cm=1')
                    .send({ remove: YesNo.no })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI + '?cm=1');
                    });
            });
        });

        describe('when answer is YES', () => {
            it('should return 500 when file identifier is missing', async () => {
                const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: YesNo.yes })
                    .expect(response => {
                        expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    });
            });

            it('should return 500 when file identifier does not exist in session', async () => {
                const app = createApp({ appeal: createAppealWithAttachments([attachment]) });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: YesNo.yes, id: '456' })
                    .expect(response => {
                        expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    });
            });

            it('should redirect to file upload page when file identifier exists in session', async () => {
                const service: SubstituteOf<FileTransferService> = createSubstituteOf<FileTransferService>();

                const app = createApp({ appeal: createAppealWithAttachments([attachment]) }, container => {
                    container.rebind(FileTransferService).toConstantValue(service);
                });

                await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                    .send({ remove: YesNo.yes, id: attachment.id })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                    });

                service.received().delete(attachment.id);
            });

            it('should redirect to file upload page when file identifier exists in session in change mode',
                async () => {
                    const service: SubstituteOf<FileTransferService> = createSubstituteOf<FileTransferService>();

                    const app = createApp({ appeal: createAppealWithAttachments([attachment]) }, container => {
                        container.rebind(FileTransferService).toConstantValue(service);
                    });

                    await request(app).post(EVIDENCE_REMOVAL_PAGE_URI)
                        .query('cm=1')
                        .send({ remove: YesNo.yes, id: attachment.id })
                        .expect(response => {
                            expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                            expect(response.get('Location')).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI + '?cm=1');
                        });

                    service.received().delete(attachment.id);
                });
        });
    });
});

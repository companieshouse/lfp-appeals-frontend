import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EvidenceRemovalController';
import { Appeal } from 'app/models/Appeal';
import { YesNo } from 'app/models/fields/YesNo';
import { EVIDENCE_QUESTION_URI} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const createAppeal = (): Appeal => {
    return {
        penaltyIdentifier: {
            companyNumber: '00345567',
            penaltyReference: 'A00000001',
        },
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'They are legit',
            }
        }
    };
};


describe('EvidenceQuestionController', () => {

    describe('GET request', () => {

        it('should return 200 when accessing evidence question page', async () => {
            const app = createApp({appeal: createAppeal()});

            await request(app).get(`${EVIDENCE_QUESTION_URI}`)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include('Do you want to add documents to support your application?');
                });
        });
    });

    describe('POST request', () => {
        it('should render errors when no answer was provided', async () => {
            const app = createApp({appeal: createAppeal()});

            await request(app).post(EVIDENCE_QUESTION_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include('Do you want to add documents to support your application?')
                        .and.to.include('There is a problem')
                        .and.to.include('You must tell us if you want to upload evidence.');
                });
        });

        describe('when answer is NO', () => {
            it('should refresh page', async () => {
                const app = createApp({appeal: createAppeal()});

                await request(app).post(EVIDENCE_QUESTION_URI)
                    .send({ evidence: YesNo.no })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_QUESTION_URI);
                    });
            });
        });

        describe('when answer is YES', () => {
            it('should refresh page', async () => {
                const app = createApp({appeal: createAppeal()});

                await request(app).post(EVIDENCE_QUESTION_URI)
                    .send({ evidence: YesNo.yes })
                    .expect(response => {
                        expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                        expect(response.get('Location')).to.be.equal(EVIDENCE_QUESTION_URI);
                    });
            });
        });
    });
});

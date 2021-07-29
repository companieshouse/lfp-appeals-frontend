import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/IllnessFurtherInformationController';
import { Appeal } from 'app/models/Appeal';
import { ENTRY_PAGE_URI, EVIDENCE_QUESTION_URI, FURTHER_INFORMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('IllnessFurtherInformationController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access illness further information page ', async () => {
            const app = createApp();
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get('Location')).to.contain('signin');
            });
        });
    });

    describe('POST request', () => {
        const navigation = { permissions: [EVIDENCE_QUESTION_URI] };
        const appeal = {
            penaltyIdentifier: {
                companyNumber: 'NI000000',
                penaltyReference: 'A00000001'
            },
            reasons: {}
        } as Appeal;

        beforeEach(() => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';
        });

        it('should redirect to entry page when illness reason feature is disabled', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '0';

            const app = createApp({appeal});
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
            });
        });

        it('should redirect to Evidence Question page when posting a valid further information', async () => {
            const app = createApp({appeal, navigation});
            await request(app).post(FURTHER_INFORMATION_PAGE_URI)
                .send({description: 'Something'})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(EVIDENCE_QUESTION_URI);
            });
        });
    });
});
import 'reflect-metadata'

import { expect } from 'chai';
import { OK } from 'http-status-codes';
import { afterEach, beforeEach } from 'mocha';
import request from 'supertest';
import supertest from 'supertest';

import 'app/controllers/EvidenceUploadController'
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const config = getDefaultConfig();

const navigation =
    {
        permissions: [EVIDENCE_UPLOAD_PAGE_URI]
    };

const appeal = {
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
                    name: 'somefile.jpeg'
                },
                {
                    name: 'anotherfile.jpeg'
                }
            ]
        }
    }
} as Appeal;

let initialFileTransferFlag: string | undefined;

describe('EvidenceUploadController', () => {

    beforeEach(() => {
        initialFileTransferFlag = process.env.FILE_TRANSFER_FEATURE;
    });

    afterEach(() => {
        process.env.FILE_TRANSFER_FEATURE = initialFileTransferFlag;
    });

    describe('GET request', () => {
        it('should return 200 when trying to access the evidence-upload page', async () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const applicationData = {
                navigation
            } as ApplicationData;

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', applicationData);
            const app = createApp(session);

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                });
        });


        it('should return 200 when trying to access page with session data', async () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const applicationData = {
                appeal,
                navigation
            } as ApplicationData;

            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData(APPLICATION_DATA_KEY, applicationData);

            const app = createApp(session);

            await request(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect((response: supertest.Response) => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain('somefile.jpeg')
                        .and.to.contain('anotherfile.jpeg');
                });
        });
    });

    describe('POST request', () => {
        // TODO
    });
});

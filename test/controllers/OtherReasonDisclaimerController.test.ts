import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/OtherReasonDisclaimerController';
import { Appeal } from 'app/models/Appeal';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('OtherReasonDisclaimerController', () => {

    const applicationData = {
        appeal: {
            penaltyIdentifier: {
                companyNumber: 'NI000000',
                penaltyReference: 'A00000001'
            },
        } as Appeal,
        navigation: {
            permissions: [OTHER_REASON_DISCLAIMER_PAGE_URI]
        }
    };

    describe('GET request', () => {
        it('should return 200 when trying to access the other-reason-entry page', async () => {
            const app = createApp(applicationData);
            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(OK);
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to reason-other page', async () => {
            const app = createApp(applicationData);
            await request(app).post(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_PAGE_URI);
                });
        });
    });
});

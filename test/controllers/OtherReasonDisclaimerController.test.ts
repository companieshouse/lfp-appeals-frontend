import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/OtherReasonDisclaimerController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { ReasonType } from 'app/models/fields/ReasonType';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('OtherReasonDisclaimerController', () => {

    function generateApplicationData(currentReasonType?: ReasonType): ApplicationData {
        return {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'A00000001'
                },
                currentReasonType: currentReasonType ? currentReasonType: ReasonType.other
            } as Appeal,
            navigation: {
                permissions: [OTHER_REASON_DISCLAIMER_PAGE_URI]
            }
        };
    }

    describe('GET request', () => {
        it('should return 200 when trying to access the other-reason-entry page', async () => {
            const app = createApp(generateApplicationData());
            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(OK);
        });

        it('should redirect to an alternative journey if "Other" was not selected', async () => {
            const app = createApp(generateApplicationData(ReasonType.illness));
            await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(MOVED_TEMPORARILY);
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to reason-other page', async () => {
            const app = createApp(generateApplicationData());
            await request(app).post(OTHER_REASON_DISCLAIMER_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_PAGE_URI);
                });
        });
    });
});

import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK
} from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import { Appeal } from 'app/models/Appeal';
import {
    ENTRY_PAGE_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_END_DATE_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const pageHeading: string = 'When did the illness end?';
const errorLoadingPage = 'Sorry, there is a problem with the service';

describe('IllnessEndDateController', () => {

    const appeal = {
        penaltyIdentifier: {},
        reasons: {}
    } as Appeal;

    const navigation = { permissions: [ILLNESS_END_DATE_PAGE_URI] };

    describe('GET request', () => {

        it('should return 200 when trying to access the page', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            const app = createApp({appeal, navigation});
            await request(app).get(ILLNESS_END_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });

        it(`should return 500 when trying to access the page with no
                            navigation permission and feature flag enabled`, async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            const app = createApp({appeal});
            await request(app).get(ILLNESS_END_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                expect(response.text).to.contain(errorLoadingPage);
            });
        });

        it('should redirect to entry page when illness reason feature is disabled', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '0';

            const app = createApp({appeal});
            await request(app).get(ILLNESS_END_DATE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });
    });

    describe('POST request', () => {

        it('should redirect to Continued Illness page when posting a valid date', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '01', month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(FURTHER_INFORMATION_PAGE_URI);
                });
        });

    });
});

import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
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
const errorSummaryHeading: string = 'There is a problem';
const invalidStartDayErrorMessage: string = 'You must enter a day';
const invalidStartMonthErrorMessage: string = 'You must enter a month';
const invalidStartYearErrorMessage: string = 'You must enter a year';
const invalidDateErrorMessage: string = 'Enter a real date';
const invalidDateFutureErrorMessage: string = 'Start date must be today or in the past';
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

        it('should redirect to Futher Information page when posting a valid date', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '01', month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(FURTHER_INFORMATION_PAGE_URI);
                });
        });

        it('should return 422 response with rendered error messages when empty start date was submitted', async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidStartDayErrorMessage)
                        .and.to.include(invalidStartMonthErrorMessage)
                        .and.to.include(invalidStartYearErrorMessage)
                        .and.to.not.include(invalidDateErrorMessage)
                        .and.to.not.include(invalidDateFutureErrorMessage);
                });
        });
        it('should return 422 response with rendered error messages when partial start date was submitted',
        async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidStartDayErrorMessage)
                        .and.to.not.include(invalidDateErrorMessage)
                        .and.to.not.include(invalidDateFutureErrorMessage);
                });
        });

    it('should return 422 response with rendered error message invalid start date (all zeros) was submitted',
        async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '00', month: '00', year: '0000'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidDateErrorMessage);
                });
        });

    it('should return 422 response with rendered error message invalid start date (non-existing) was submitted',
        async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '32', month: '13', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidDateErrorMessage);
                });
        });

    it('should return 422 response with rendered error message invalid start date (in future) was submitted',
        async () => {
            const futureYear = (new Date().getFullYear() + 1).toString();
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '01', month: '01', year: futureYear})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidDateFutureErrorMessage);
                });
        });

    it('should redirect to entry page when illness reason feature is disabled', async () => {

        process.env.ILLNESS_REASON_FEATURE_ENABLED = '0';

        const app = createApp({appeal});
        await request(app).post(ILLNESS_END_DATE_PAGE_URI)
            .send({})
            .expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.header.location).to.include(ENTRY_PAGE_URI);
            });
    });

    });
});

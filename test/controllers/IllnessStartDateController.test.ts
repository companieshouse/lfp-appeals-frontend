import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { before } from 'mocha';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import {
    ENTRY_PAGE_URI,
    ILLNESS_START_DATE_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const pageHeading: string = 'When did the illness start?';
const errorSummaryHeading: string = 'There is a problem';
const invalidStartDayErrorMessage: string = 'You must enter a day';
const invalidStartMonthErrorMessage: string = 'You must enter a month';
const invalidStartYearErrorMessage: string = 'You must enter a year';
const invalidDateErrorMessage: string = 'Enter a real date';
const invalidDateFutureErrorMessage: string = 'Start date must be today or in the past';

describe('IllnessStartDateController', () => {

    describe('GET request', () => {

        before(() => {
            process.env.ILLNESS_REASON_FEATURE = '1';
        });

        it('should return 200 when trying to access the page', async () => {
            const app = createApp();
            await request(app).get(ILLNESS_START_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });

        it('should redirect to entry page when illness reason feature is disabled', async () => {

            process.env.ILLNESS_REASON_FEATURE = '0';

            const app = createApp();
            await request(app).get(ILLNESS_START_DATE_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });
    });
    describe('POST request', () => {

        before(() => {
            process.env.ILLNESS_REASON_FEATURE = '1';
        });

        it('should return 200 when posting a valid date', async () => {
            const app = createApp();
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                .send({startDay: '01', startMonth: '01', startYear: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading);
                });
        });
        it('should return 422 response with rendered error messages when empty start date was submitted', async () => {
            const app = createApp();
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
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
                const app = createApp();
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({startMonth: '01', startYear: '2020'})
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidStartDayErrorMessage)
                            .and.to.not.include(invalidDateErrorMessage)
                            .and.to.not.include(invalidDateFutureErrorMessage);
                    });
            });
        it('should return 422 response with rendered error message invalid start date (format) was submitted',
            async () => {
                const app = createApp();
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({startDay: '123', startMonth: '01', startYear: '2000'})
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(invalidStartDayErrorMessage)
                            .and.to.not.include(invalidDateErrorMessage)
                            .and.to.not.include(invalidDateFutureErrorMessage);
                    });
            });
        it('should return 422 response with rendered error message invalid start date (all zeros) was submitted',
            async () => {
                const app = createApp();
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({startDay: '00', startMonth: '00', startYear: '00'})
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateErrorMessage);
                    });
            });
        it('should return 422 response with rendered error message invalid start date (non-existing) was submitted',
            async () => {
                const app = createApp();
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({startDay: '32', startMonth: '13', startYear: '2020'})
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateErrorMessage);
                    });
            });
        it('should return 422 response with rendered error message invalid start date (in future) was submitted',
            async () => {
                const app = createApp();
                await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                    .send({startDay: '01', startMonth: '01', startYear: '2029'})
                    .expect(response => {
                        expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                        expect(response.text).to.include(pageHeading)
                            .and.to.include(errorSummaryHeading)
                            .and.to.include(invalidDateFutureErrorMessage);
                    });
            });
        it('should redirect to entry page when illness reason feature is disabled', async () => {

            process.env.ILLNESS_REASON_FEATURE = '0';

            const app = createApp();
            await request(app).post(ILLNESS_START_DATE_PAGE_URI)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ENTRY_PAGE_URI);
                });
        });
    });
});

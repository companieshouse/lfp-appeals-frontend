import { expect } from 'chai';
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from 'http-status-codes';
import moment from 'moment';
import request from 'supertest';

import 'app/controllers/EvidenceDownloadController';
import { Appeal } from 'app/models/Appeal';
import { IllPerson } from 'app/models/fields/IllPerson';
import {
    ENTRY_PAGE_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_END_DATE_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

const pageHeading: string = 'When did the illness end?';
const errorSummaryHeading: string = 'There is a problem';
const invalidEndDayErrorMessage: string = 'You must enter a day';
const invalidEndMonthErrorMessage: string = 'You must enter a month';
const invalidEndYearErrorMessage: string = 'You must enter a year';
const invalidDateErrorMessage: string = 'Enter a real date';
const invalidDateFutureErrorMessage: string = 'Start date must be today or in the past';
const errorLoadingPage = 'Sorry, there is a problem with the service';
let initialIllnessReasonFeatureFlag: string | undefined;

describe('IllnessEndDateController', () => {

    before(done => {
        initialIllnessReasonFeatureFlag = process.env.ILLNESS_REASON_FEATURE_ENABLED;
        done();
    });

    after(done => {
        process.env.ILLNESS_REASON_FEATURE_ENABLED = initialIllnessReasonFeatureFlag;
        done();
    });

    const appeal = {
        penaltyIdentifier: {},
        reasons: {}
    } as Appeal;

    const navigation = { permissions: [ILLNESS_END_DATE_PAGE_URI] };

    describe('GET request', () => {

        it('should return 200 when trying to access the page with illnessStart date set', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';
            appeal.reasons = {
                illness: {
                    illPerson: IllPerson.director,
                    illnessStart: '2020-05-01',
                    continuedIllness: false,
                    illnessImpactFurtherInformation: 'test'
                }
            };

            const app = createApp({appeal, navigation});
            await request(app).get(ILLNESS_END_DATE_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(OK);
                expect(response.text).to.contain(pageHeading);
            });
        });

        it('should return 200 when trying to access the page with illness end date populated', async () => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            appeal.reasons = {
                illness: {
                    illPerson: IllPerson.director,
                    illnessStart: moment('2019-12-31').format('YYYY-MM-DD'),
                    continuedIllness: false,
                    illnessImpactFurtherInformation: 'test',
                    illnessEnd: moment('2020-01-01').format('YYYY-MM-DD')
                }
            };

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

        beforeEach(done => {
            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';
            done();
        });

        it('should redirect to Futher Information page when posting a valid date', async () => {

            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '01', month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(FURTHER_INFORMATION_PAGE_URI);
                });
        });

        it('should redirect to Futher Information page when posting a valid date', async () => {
            appeal.reasons = {
                illness: {
                    illPerson: IllPerson.director,
                    illnessStart: moment('2019-12-31').format('YYYY-MM-DD'),
                    continuedIllness: false,
                    illnessImpactFurtherInformation: 'test'
                }
            };

            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({day: '01', month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(FURTHER_INFORMATION_PAGE_URI);
                });
        });

        it('should return 422 response with rendered error messages when empty end date was submitted', async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send()
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidEndDayErrorMessage)
                        .and.to.include(invalidEndMonthErrorMessage)
                        .and.to.include(invalidEndYearErrorMessage)
                        .and.to.not.include(invalidDateErrorMessage)
                        .and.to.not.include(invalidDateFutureErrorMessage);
                });
        });

        it('should return 422 response with rendered error messages when partial end date was submitted', async () => {
            const app = createApp({appeal});
            await request(app).post(ILLNESS_END_DATE_PAGE_URI)
                .send({month: '01', year: '2020'})
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidEndDayErrorMessage)
                        .and.to.not.include(invalidDateErrorMessage)
                        .and.to.not.include(invalidDateFutureErrorMessage);
                });
        });

        it('should return 422 response with rendered error message invalid end date (all zeros) was submitted',
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

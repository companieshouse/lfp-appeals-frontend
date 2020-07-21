import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY } from 'http-status-codes';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import 'app/controllers/SelectPenaltyController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { REVIEW_PENALTY_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';

describe('SelectPenaltyController', () => {

    it('GET: should render the radio buttons', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'PEN1A/NI000000',
                    companyName: 'Test',
                    penaltyList: {
                        items: [
                            {
                                type: 'penalty',
                                madeUpDate: '12 May 2020',
                                originalAmount: 3000,
                                transactionDate: '12 May 2019',
                                id: 'A0000001'
                            } as Penalty,
                            {
                                type: 'penalty',
                                madeUpDate: '31 May 2019',
                                originalAmount: 250,
                                transactionDate: '31 May 2018',
                                id: 'A0000002'
                            } as Penalty
                        ]
                    } as PenaltyList
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app)
            .get(SELECT_THE_PENALTY_PAGE_URI)
            .expect(res => {
                expect(res.text).to.include('type="radio"');
                expect(res.text).to.include('value="A0000001"');
                expect(res.text).to.include('value="A0000002"');
            });
    });

    it('GET: should redirect to Company Authentication when user is not authenticated', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI999999',
                    penaltyReference: 'PEN1A/NI000000',
                    companyName: 'Test',
                    penaltyList: {
                        items: [
                            {} as Penalty,
                            {} as Penalty
                        ]
                    } as PenaltyList
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };

        /* TODO: Work out how to use this function call to override default Company Number
        This will make the test data more clear, instead of changing the CN in the applicationData
        above */
        const app = createApp(applicationData);

        await request(app)
            .get(SELECT_THE_PENALTY_PAGE_URI)
            .expect(res => {
                expect(res.status).to.be.equal(MOVED_TEMPORARILY);
                expect(res.text).to.contain('Found. Redirecting')
                    .and.to.contain('oauth2/authorise')
                    .and.to.contain('scope=https://api.companieshouse.gov.uk/company/NI999999');
            });
    });


    it('POST: should show an error if the penalty list is undefined', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'PEN1A/NI000000',
                    companyName: 'Test',
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };
        const app = createApp(applicationData);

        await request(app)
            .post(SELECT_THE_PENALTY_PAGE_URI)
            .expect(INTERNAL_SERVER_ERROR)
            .expect(res => expect(res.text).to.contain('Sorry, there is a problem with the service'));
    });

    it('POST: should show errors around the radio buttons if no option is selected', async () => {

        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'PEN1A/NI000000',
                    companyName: 'Test',
                    penaltyList: {
                        items: [
                            {
                                type: 'penalty',
                                madeUpDate: '12 May 2020',
                                originalAmount: 3000,
                                transactionDate: '12 May 2019',
                                id: 'A0000001'
                            } as Penalty,
                            {
                                type: 'penalty',
                                madeUpDate: '31 May 2019',
                                originalAmount: 250,
                                transactionDate: '31 May 2018',
                                id: 'A0000002'
                            } as Penalty
                        ]
                    } as PenaltyList
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };
        const app = createApp(applicationData);

        await request(app)
            .post(SELECT_THE_PENALTY_PAGE_URI)
            .expect(res => expect(res.text).to.contain('Select the penalty you want to appeal'));


    });

    it('POST: should redirect to the review penalty page when penalty is selected', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'PEN1A/NI000000',
                    companyName: 'Test',
                    penaltyList: {
                        items: [
                            {
                                type: 'penalty',
                                madeUpDate: '12 May 2020',
                                originalAmount: 3000,
                                transactionDate: '12 May 2019',
                                id: 'A0000001'
                            } as Penalty,
                            {
                                type: 'penalty',
                                madeUpDate: '31 May 2019',
                                originalAmount: 250,
                                transactionDate: '31 May 2018',
                                id: 'A0000002'
                            } as Penalty
                        ]
                    } as PenaltyList
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };
        const app = createApp(applicationData);

        await request(app)
            .post(SELECT_THE_PENALTY_PAGE_URI)
            .send({ selectPenalty: 'A0000001' })
            .expect(302)
            .expect(res => expect(res.get('Location')).to.equal(REVIEW_PENALTY_PAGE_URI));

    });

});

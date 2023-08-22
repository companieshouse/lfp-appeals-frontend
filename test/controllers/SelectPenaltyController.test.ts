import { Penalty, PenaltyList } from '@companieshouse/api-sdk-node/dist/services/lfp';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import 'app/controllers/SelectPenaltyController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { REVIEW_PENALTY_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';

describe('SelectPenaltyController', () => {
    const penaltyList = {
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
    } as PenaltyList;

    const penaltyIdentifier = {
        companyNumber: 'NI000000',
        penaltyReference: 'A0000001',
        companyName: 'Test'
    };

    it('GET: should render the radio buttons', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    ...penaltyIdentifier,
                    penaltyList
                }
            } as Appeal,
            navigation: { permissions: [SELECT_THE_PENALTY_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app)
            .get(SELECT_THE_PENALTY_PAGE_URI)
            .expect(res => {
                expect(res.text)
                    .to.include('type="radio"')
                    .to.include('value="A0000001"')
                    .to.include('value="A0000002"')
                    .to.include('Accounts made up to 12 May 2020')
                    .to.include('Accounts made up to 31 May 2019')
                    .to.include('These accounts were filed 12 May 2019.')
                    .to.include('The late filing penalty is £3000.')
                    .to.include('These accounts were filed 31 May 2018.')
                    .to.include('The late filing penalty is £250.')
                    .to.include('value="A0000001" checked')
                    .not.to.include('value="A0000002" checked');
            });
    });

    it('POST: should show an error if the penalty list is undefined', async () => {
        const applicationData: Partial<ApplicationData> = {
            appeal: { penaltyIdentifier } as Appeal,
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
                    ...penaltyIdentifier,
                    penaltyList
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
                    ...penaltyIdentifier,
                    penaltyList
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

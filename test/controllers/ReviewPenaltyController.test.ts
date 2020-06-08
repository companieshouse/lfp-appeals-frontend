import 'reflect-metadata';

import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, OK } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/ReviewPenaltyController';
import { Appeal } from 'app/models/Appeal';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('ReviewPenaltyController', () => {

    const companyNumber: string = 'NI000000';
    const companyName: string = 'Test Ltd.';
    const penaltyReference: string = 'A0000000';
    const penalty: Partial<Penalty> = {
        type: 'penalty',
        madeUpDate: '12 May 2020',
        originalAmount: 3000,
        transactionDate: '12 May 2019',
        id: penaltyReference
    };
    const penaltyList: Partial<PenaltyList> = {
        items: [penalty as Penalty]
    };

    it('should show correct penalty details and company name', async () => {

        const appeal: Partial<Appeal> = {
            penaltyIdentifier: {
                companyNumber,
                companyName,
                penaltyReference,
                penaltyList: penaltyList as PenaltyList
            }
        };

        const total: number = penaltyList.items!
            .reduce((previous: number, current: Penalty) => previous + current.originalAmount, 0);

        const app = createApp({ appeal: appeal as Appeal, navigation: { permissions: [REVIEW_PENALTY_PAGE_URI] } });

        await request(app)
            .get(REVIEW_PENALTY_PAGE_URI)
            .expect(OK)
            .expect(res => {
                expect(res.text).to.contain(companyName)
                    .and.to.contain(penaltyReference)
                    .and.to.contain('12 May 2020')
                    .and.to.contain('12 May 2019')
                    .and.to.contain(`£${penalty.originalAmount}`)
                    .and.to.contain('Late Filing Penalty')
                    .and.to.contain('Total:')
                    .and.to.contain(total);
            });

    });

    it('should go to other reasons disclaimer screen when continue is pressed', async () => {

        const appeal: Partial<Appeal> = {
            penaltyIdentifier: {
                companyNumber,
                companyName,
                penaltyReference,
                penaltyList: penaltyList as PenaltyList
            }
        };

        const app = createApp({
            appeal: appeal as Appeal, navigation: {
                permissions: [REVIEW_PENALTY_PAGE_URI]
            }
        });

        await request(app)
            .post(REVIEW_PENALTY_PAGE_URI)
            .expect(302)
            .expect(res => expect(res.get('Location')).to.equal(OTHER_REASON_DISCLAIMER_PAGE_URI));
    });

    it('should redirect to error page if penalty list is not found in appeal', async () => {

        const appeal: Partial<Appeal> = {
            penaltyIdentifier: {
                companyNumber,
                companyName,
                penaltyReference,
            }
        };

        const app = createApp({
            appeal: appeal as Appeal, navigation: {
                permissions: [REVIEW_PENALTY_PAGE_URI]
            }
        });

        await request(app)
            .get(REVIEW_PENALTY_PAGE_URI)
            .expect(response => {
                expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                expect(response.text).to.contain('Sorry, there is a problem with the service');
            });
    });

});
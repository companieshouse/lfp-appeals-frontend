import { expect } from 'chai';
import { MOVED_TEMPORARILY } from 'http-status-codes';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { REVIEW_PENALTY_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';


describe('All pages after the Penalty Details page:', () => {

    const pageList = [
        { name: 'Select Penalty', uri: SELECT_THE_PENALTY_PAGE_URI},
        { name: 'Review Penalty', uri: REVIEW_PENALTY_PAGE_URI}
    ];

    pageList.forEach((page) => {
        it(`The ${page.name} page should redirect unauthenticated user to the Company Auth service`, async () => {

            const applicationData: Partial<ApplicationData> = {
                appeal: {
                    penaltyIdentifier: {
                        companyNumber: 'NI999999'
                    }
                } as Appeal,
                navigation: { permissions: [ page.uri ] }
            };

            const app = createApp(applicationData);

            await request(app)
                .get(page.uri)
                .expect(res => {
                    expect(res.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(res.text).to.contain('Found. Redirecting')
                        .and.to.contain('oauth2/authorise')
                        .and.to.contain('scope=https://api.companieshouse.gov.uk/company/NI999999');
                });
        });
    });
});
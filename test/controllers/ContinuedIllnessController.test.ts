import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { CONTINUED_ILLNESS_PAGE_URI } from 'app/utils/Paths';

describe('ContinuedIllnessController', () => {

    it('should show radio buttons for Yes and No on GET', async () => {
        const  applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000'
                }
            } as Appeal,
            navigation: { permissions: [CONTINUED_ILLNESS_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app).get(CONTINUED_ILLNESS_PAGE_URI).expect(res => {
            expect(res.text).to.include('type="radio"');
            expect(res.text).to.include('value="yes"');
            expect(res.text).to.include('value="no"');
            const radioCount = (res.text.match(/type="radio"/g) || []).length;
            expect(radioCount).to.equal(2);
        });

    });


    it('should show an error if no option is selected on POST', async () => {
        const  applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000'
                }
            } as Appeal,
            navigation: { permissions: [CONTINUED_ILLNESS_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app).post(CONTINUED_ILLNESS_PAGE_URI).expect(res => {
            expect(res.status).to.equal(422);
            expect(res.text).to.contain('You must tell us if this is a continued illness');
        });
    });
});
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { CHOOSE_REASON_PAGE_URI } from 'app/utils/Paths';

describe('ChooseAppealReasonController', () => {

    it('should show radio buttons for available appeal reasons on GET', async () => {
        const  applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000'
                }
            } as Appeal,
            navigation: { permissions: [CHOOSE_REASON_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app).get(CHOOSE_REASON_PAGE_URI).expect(res => {
            expect(res.text).to.include('type="radio"');
            expect(res.text).to.include('value="illness"');
            expect(res.text).to.include('value="other"');
            const radioCount = (res.text.match(/type="radio"/g) || []).length;
            expect(radioCount).to.equal(2);
        });

    });


    it('should show an error if no appeal reason is selected on POST', async () => {
        const  applicationData: Partial<ApplicationData> = {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000'
                }
            } as Appeal,
            navigation: { permissions: [CHOOSE_REASON_PAGE_URI] }
        };

        const app = createApp(applicationData);

        await request(app).post(CHOOSE_REASON_PAGE_URI).expect(res => {
            expect(res.status).to.equal(422);
            expect(res.text).to.contain('You must select a reason');
        });
    });
});
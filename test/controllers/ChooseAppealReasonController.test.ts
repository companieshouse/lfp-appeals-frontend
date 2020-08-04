import { expect } from 'chai';
import { MOVED_TEMPORARILY, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { ReasonType } from 'app/models/fields/ReasonType';
import { CHOOSE_REASON_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from 'app/utils/Paths';

describe('ChooseAppealReasonController', () => {

    const applicationData: Partial<ApplicationData> = {
        appeal: {
            penaltyIdentifier: {
                companyNumber: 'NI000000'
            }
        } as Appeal,
        navigation: { permissions: [CHOOSE_REASON_PAGE_URI] }
    };

    describe('on GET', () => {

        it('should show radio buttons for available appeal reasons', async () => {
            const app = createApp(applicationData);

            await request(app).get(CHOOSE_REASON_PAGE_URI).expect(res => {
                expect(res.text).to.include('type="radio"');
                expect(res.text).to.include('value="illness"');
                expect(res.text).to.include('value="other"');
                const radioCount = (res.text.match(/type="radio"/g) || []).length;
                expect(radioCount).to.equal(2);
            });
        });
    });

    describe('on POST', () => {

        it('should show an error if no appeal reason is selected', async () => {
            const app = createApp(applicationData);

            await request(app).post(CHOOSE_REASON_PAGE_URI).expect(res => {
                expect(res.status).to.equal(UNPROCESSABLE_ENTITY);
                expect(res.text).to.contain('You must select a reason');
            });
        });

        it('should send the user to the first page of the Other journey if a reason is selected', async () => {
            const app = createApp(applicationData);

            await request(app).post(CHOOSE_REASON_PAGE_URI).send({ reason: ReasonType.other }).expect(res => {
                expect(res.status).to.equal(MOVED_TEMPORARILY);
                expect(res.header.location).to.include(OTHER_REASON_DISCLAIMER_PAGE_URI);
            });
        });
    });
});
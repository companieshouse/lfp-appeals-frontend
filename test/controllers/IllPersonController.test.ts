import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { ILL_PERSON_PAGE_URI } from 'app/utils/Paths';

describe('IllPersonController', () => {

    const applicationData: Partial<ApplicationData> = {
        appeal: {
            penaltyIdentifier: {
                companyNumber: 'NI000000'
            }
        } as Appeal,
        navigation: { permissions: [ILL_PERSON_PAGE_URI] }
    };

    it('should show radio buttons for available Ill Person options on GET', async () => {
        const app = createApp(applicationData);

        await request(app).get(ILL_PERSON_PAGE_URI).expect(res => {
            expect(res.text).to.include('type="radio"');
            expect(res.text).to.include('value="director"');
            expect(res.text).to.include('value="accountant"');
            expect(res.text).to.include('value="family"');
            expect(res.text).to.include('value="employee"');
            expect(res.text).to.include('value="otherPerson"');
            const radioCount = (res.text.match(/type="radio"/g) || []).length;
            expect(radioCount).to.equal(5);
        });
    });

    it('should hide the Other Person conditional input by default', async () => {
        const app = createApp(applicationData);

        await request(app).get(ILL_PERSON_PAGE_URI).expect(res => {
            expect(res.text).to.include('class="govuk-radios__conditional govuk-radios__conditional--hidden"');
            expect(res.text).to.include('name="otherPerson"');
        });
    });

    it('should show an error if no person is selected on POST', async () => {
        const app = createApp(applicationData);

        await request(app).post(ILL_PERSON_PAGE_URI).expect(res => {
            expect(res.status).to.equal(422);
            expect(res.text).to.contain('You must select a person');
        });
    });


    it('should show an error if "Other" is chosen but not specified on POST', async () => {
        const app = createApp(applicationData);

        await request(app).post(ILL_PERSON_PAGE_URI).send({ illPerson: 'otherPerson' }).expect(res => {
            expect(res.text).to.include('class="govuk-radios__conditional"');
            expect(res.status).to.equal(422);
            expect(res.text).to.contain('You must tell us more information');
        });
    });
});
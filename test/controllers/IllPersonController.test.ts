import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import request from 'supertest';
import { createApp } from '../ApplicationFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { IllPerson } from 'app/models/fields/IllPerson';
import { ILL_PERSON_PAGE_URI, ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';

const invalidSelectPersonMessage = 'You must select a person';
const invalidDescriptionErrorMessage = 'You must tell us more information';
const errorServiceProblem = 'Sorry, there is a problem with the service';

describe('IllPersonController', () => {

    const navigation = { permissions: [ILL_PERSON_PAGE_URI] };
    const penaltyIdentifier = { companyNumber: 'NI000000' };

    const applicationData: Partial<ApplicationData> = {
        appeal: { penaltyIdentifier } as Appeal,
        navigation
    };

    const illnessApplicationData: Partial<ApplicationData> = {
        appeal: {
            penaltyIdentifier,
            reasons: { illness: {} }
        } as Appeal,
        navigation
    };

    describe('on GET', () => {
        it('should show radio buttons for available Ill Person options', async () => {
            const app = createApp(applicationData);

            await request(app).get(ILL_PERSON_PAGE_URI).expect(response => {
                expect(response.text).to.include('type="radio"');
                expect(response.text).to.include('value="director"');
                expect(response.text).to.include('value="accountant"');
                expect(response.text).to.include('value="family"');
                expect(response.text).to.include('value="employee"');
                expect(response.text).to.include('value="someoneElse"');
                const radioCount = (response.text.match(/type="radio"/g) || []).length;
                expect(radioCount).to.equal(5);
            });
        });

        it('should hide the Other Person conditional input by default', async () => {
            const app = createApp(applicationData);

            await request(app).get(ILL_PERSON_PAGE_URI).expect(response => {
                expect(response.text).to.include('class="govuk-radios__conditional govuk-radios__conditional--hidden"');
                expect(response.text).to.include('name="otherPerson"');
            });
        });
    });

    describe('on POST', () => {
        it('should show a validation error if no person is selected', async () => {
            const app = createApp(applicationData);

            await request(app).post(ILL_PERSON_PAGE_URI).expect(response => {
                expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
                expect(response.text).to.contain(invalidSelectPersonMessage);
            });
        });


        it('should show a validation error if "Someone else" is chosen but not specified', async () => {
            const app = createApp(applicationData);

            await request(app).post(ILL_PERSON_PAGE_URI).send({ illPerson: IllPerson.someoneElse }).expect(response => {
                expect(response.text).to.include('class="govuk-radios__conditional"');
                expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
                expect(response.text).to.contain(invalidDescriptionErrorMessage);
            });
        });

        it('should redirect to Illness Start Date page when valid ill person is entered', async () => {
            const app = createApp(illnessApplicationData);

            await request(app).post(ILL_PERSON_PAGE_URI)
                .send({ illPerson: IllPerson.accountant })
                .expect(response => {
                    expect(response.status).to.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ILLNESS_START_DATE_PAGE_URI);
                });
        });

        it('should redirect to Illness Start Date page when valid someone else ill is entered', async () => {
            const app = createApp(illnessApplicationData);

            await request(app).post(ILL_PERSON_PAGE_URI)
                .send({ illPerson: IllPerson.someoneElse, otherPerson: 'Banana Hungry Peach' })
                .expect(response => {
                    expect(response.status).to.equal(MOVED_TEMPORARILY);
                    expect(response.header.location).to.include(ILLNESS_START_DATE_PAGE_URI);
                });
        });

        it(`should fail with 500 error when passing an empty reason object`, async () => {
            const app = createApp(applicationData);

            await request(app).post(ILL_PERSON_PAGE_URI)
                .send({illPerson: IllPerson.accountant})
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.include(errorServiceProblem);
                });
        });
    });
});

import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/CheckYourAppealController';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Navigation } from 'app/models/Navigation';
import { IllPerson } from 'app/models/fields/IllPerson';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

const attachments = [
  {
    id: '1',
    name: 'some-file.jpeg'
  } as Attachment,
  {
    id: '2',
    name: 'another-file.jpeg'
  } as Attachment
];

const illnessReasonContinuedFalse = {
    illPerson: IllPerson.employee,
    illnessStart: '2020-11-12',
    continuedIllness: false,
    illnessImpactFurtherInformation: 'test',
    attachments
};

const illnessReasonContinuedTrue = {
    illPerson: IllPerson.employee,
    illnessStart: '2020-11-12',
    illnessEnd: '2020-12-12',
    continuedIllness: true,
    illnessImpactFurtherInformation: 'test',
    attachments
};

const otherReason = {
  title: 'I have reasons',
  description: 'they are legit',
  attachments
};

const createdBy = {
  name: 'someName',
  relationshipToCompany: 'someRelationshipToCompany'
};

const baseAppeal = {
  createdBy,
  penaltyIdentifier: {
    companyName: 'company-name-test',
    companyNumber: 'NI000000',
    userInputPenaltyReference: '',
    penaltyReference: 'A00000001',
  },
} as Appeal;

function getAppeal(): Appeal {
  return {
    ...baseAppeal,
    reasons: {
      other: otherReason
    }
  } as Appeal;
}

const pageHeading: string = 'Check your appeal';
const subHeading: string = 'Reason for appeal';

describe('CheckYourAppealController', () => {
  const navigation = {
    permissions: [CHECK_YOUR_APPEAL_PAGE_URI]
  } as Navigation;

  describe('GET request', () => {
    it('should return 200 with populated session data with other reason', async () => {

      const applicationData = {
        appeal: {
          ...baseAppeal,
          reasons: {
            other: otherReason
          }
        },
        navigation
      } as ApplicationData;

      const app = createApp(applicationData);

      await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
        .expect(response => {
          expect(response.status).to.be.equal(OK);
          expect(response.text)
            .to.contain(pageHeading).and
            .to.contain(applicationData.appeal.penaltyIdentifier.companyName).and
            .to.contain(applicationData.appeal.penaltyIdentifier.companyNumber).and
            .to.contain(applicationData.appeal.penaltyIdentifier.penaltyReference).and
            .to.contain('test').and
            .to.contain(subHeading).and
            .to.contain(applicationData.appeal.reasons.other!.title).and
            .to.contain(applicationData.appeal.reasons.other!.description).and
            .to.contain(applicationData.appeal.createdBy?.name).and
            .to.contain(applicationData.appeal.createdBy?.relationshipToCompany).and
            .to.contain(`href="/appeal-a-penalty/download/data/1/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
            .nested.contain('some-file.jpeg').and
            .to.contain(`href="/appeal-a-penalty/download/data/2/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
            .nested.contain('another-file.jpeg');
        });
    });

    it('should show illness reason section and populated data where the continued illness is true', async () => {

          const applicationData = {
              appeal: {
                  ...baseAppeal,
                  reasons: {
                      illness: illnessReasonContinuedFalse
                  }
              },
              navigation
          } as ApplicationData;

          const app = createApp(applicationData);

          await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
              .expect(response => {
                  expect(response.status).to.be.equal(OK);
                  expect(response.text)
                      .to.contain(pageHeading).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.companyName).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.companyNumber).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.penaltyReference).and
                      .to.contain('test').and
                      .to.contain(subHeading).and
                      .to.contain('Employee').and
                      .to.contain('12 November 2020').and
                      .to.contain(applicationData.appeal.createdBy?.name).and
                      .to.contain(applicationData.appeal.reasons.illness?.illnessImpactFurtherInformation)
                      .to.contain(`href="/appeal-a-penalty/download/data/1/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
                      .nested.contain('some-file.jpeg').and
                      .to.contain(`href="/appeal-a-penalty/download/data/2/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
                      .nested.contain('another-file.jpeg')
                      .not.to.contain(applicationData.appeal.createdBy?.relationshipToCompany);
              });
      });
    it('should show illness reason section and populated data where the continued illness is false', async () => {

          const applicationData = {
              appeal: {
                  ...baseAppeal,
                  reasons: {
                      illness: illnessReasonContinuedTrue
                  }
              },
              navigation
          } as ApplicationData;

          const app = createApp(applicationData);

          await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
              .expect(response => {
                  expect(response.status).to.be.equal(OK);
                  expect(response.text)
                      .to.contain(pageHeading).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.companyName).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.companyNumber).and
                      .to.contain(applicationData.appeal.penaltyIdentifier.penaltyReference).and
                      .to.contain('test').and
                      .to.contain(subHeading).and
                      .to.contain('Employee').and
                      .to.contain('12 November 2020').and
                      .to.contain('12 December 2020').and
                      .to.contain(applicationData.appeal.createdBy?.name).and
                      .to.contain(applicationData.appeal.reasons.illness?.illnessImpactFurtherInformation)
                      .to.contain(`href="/appeal-a-penalty/download/data/1/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
                      .nested.contain('some-file.jpeg').and
                      .to.contain(`href="/appeal-a-penalty/download/data/2/download?c=${applicationData.appeal.penaltyIdentifier.companyNumber}"`)
                      .nested.contain('another-file.jpeg')
                      .not.to.contain(applicationData.appeal.createdBy?.relationshipToCompany);
              });
      });
  });

    describe('POST request', () => {

      function getApplicationData(): ApplicationData {
        return {
          appeal: getAppeal(),
          navigation,
        } as ApplicationData;
      }

      it('should redirect to confirmation page when email sending succeeded', async () => {

        const applicationData = getApplicationData();

        const appealsService = createSubstituteOf<AppealsService>(service => {
          service.save(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve('1'));
        });

        const app = createApp(applicationData, container => {
          container.rebind(AppealsService).toConstantValue(appealsService);
        });

        await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
          .expect(response => {
            expect(response.status).to.be.equal(MOVED_TEMPORARILY);
            expect(response.get('Location')).to.be.equal(CONFIRMATION_PAGE_URI);
            expect(applicationData.appeal).to.deep.equal({});
            expect(applicationData.submittedAppeal).to.deep.equal({
              ...getAppeal(),
              createdBy: { emailAddress: 'test', ...createdBy },
              id: '1'
            } as Appeal);
          });
      });

      it('should render error when appeal storage failed', async () => {

        const applicationData = getApplicationData();

        const app = createApp(applicationData, container => {

          container.rebind(AppealsService)
            .toConstantValue(createSubstituteOf<AppealsService>(service => {
              service.save(Arg.any(), Arg.any(), Arg.any())
                .returns(Promise.reject(Error('Unexpected error')));
            }));
        });

        await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
          .expect(response => {
            expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
          });
      });

      it('should store appeal', async () => {

        const token: string =
          '/T+R3ABq5SPPbZWSeePnrDE1122FEZSAGRuhmn21aZSqm5UQt/wqixlSViQPOrWe2iFb8PeYjZzmNehMA3JCJg==';

        const refreshToken: string =
          'xUHinh19D17SQV2BYRLnGEZgeovYhcVitzLJMxpGxXW0w+30EYBb+6yF44pDWPsPejI17R5JSwy/Cw5kYQKO2A==';

        const appealsService = createSubstituteOf<AppealsService>(service => {
          service.save(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve('1'));
        });

        const applicationData = getApplicationData();

        const app = createApp(applicationData, container => {
          container.rebind(AppealsService).toConstantValue(appealsService);
        });

        await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

        appealsService.received().save(
          { ...getAppeal(), createdBy: { emailAddress: 'test', ...createdBy }, id: '1' },
          token,
          refreshToken
        );
      });
    });
});

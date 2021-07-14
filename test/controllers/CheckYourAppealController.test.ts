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
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory';

function getAppeal(): Appeal {
    return {
        penaltyIdentifier: {
            companyName: 'company-name-test',
            companyNumber: 'NI000000',
            penaltyReference: 'A00000001',
        },
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'they are legit',
                attachments: [
                    {
                        id: '1',
                        name: 'some-file.jpeg'
                    } as Attachment,
                    {
                        id: '2',
                        name: 'another-file.jpeg'
                    } as Attachment
                ]
            }
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
        it('should return 200 with populated session data', async () => {

            const appeal = getAppeal();

            const applicationData = {
                appeal,
                navigation
            } as ApplicationData;

            const app = createApp(applicationData);

            await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text)
                        .to.contain(pageHeading).and
                        .to.contain(appeal.penaltyIdentifier.companyName).and
                        .to.contain(appeal.penaltyIdentifier.companyNumber).and
                        .to.contain(appeal.penaltyIdentifier.penaltyReference).and
                        .to.contain('test').and
                        .to.contain(subHeading).and
                        .to.contain(appeal.reasons.other!.title).and
                        .to.contain(appeal.reasons.other!.description).and
                        .to.contain(`href="/appeal-a-penalty/download/data/1/download?c=${appeal.penaltyIdentifier.companyNumber}"`)
                        .nested.contain('some-file.jpeg').and
                        .to.contain(`href="/appeal-a-penalty/download/data/2/download?c=${appeal.penaltyIdentifier.companyNumber}"`)
                        .nested.contain('another-file.jpeg');
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

        it('should send email with appeal to internal team and submission confirmation to user', async () => {
            const emailService = createSubstituteOf<EmailService>(service => {
                service.send(Arg.any()).returns(Promise.resolve());
            });

            const applicationData = getApplicationData();

            const app = createApp(applicationData, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

            emailService.received().send(Arg.is((email: Email) => {
                return email.to === 'appeals.ch.fake+NI@gmail.com'
                    && email.body.templateName === 'lfp-appeal-submission-internal';
            }));
            emailService.received().send(Arg.is((email: Email) => {
                return email.to === 'test'
                    && email.body.templateName === 'lfp-appeal-submission-confirmation';
            }));
        });

        it('should redirect to confirmation page when email sending succeeded', async () => {

            const applicationData = getApplicationData();

            const appealsService = createSubstituteOf<AppealsService>(service => {
                service.save(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve('1'));
            });

            const app = createApp(applicationData, container => {
                container.rebind(EmailService).toConstantValue(createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                }));

                container.rebind(AppealsService).toConstantValue(appealsService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(CONFIRMATION_PAGE_URI);
                    expect(applicationData.appeal).to.deep.equal({});
                    expect(applicationData.submittedAppeal).to.deep.equal({
                        ...getAppeal(),
                        createdBy: { emailAddress: 'test' },
                        id: '1'
                    } as Appeal);
                });
        });

        it('should not send email to user and render error when internal email did not send', async () => {

            const applicationData = getApplicationData();

            const emailService = createSubstituteOf<EmailService>(service => {
                service.send(Arg.any()).returns(Promise.reject(Error('Unexpected error')));
            });
            const app = createApp(applicationData, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                });

            emailService.didNotReceive().send(Arg.is((email: Email) => {
                return email.body.templateName === 'lfp-appeal-submission-confirmation';
            }));
        });

        it('should render error when only user email did not send', async () => {
            const emailService = createSubstituteOf<EmailService>(service => {
                service.send(Arg.is((email: Email) => {
                    return email.body.templateName === 'lfp-appeal-submission-internal';
                })).returns(Promise.resolve());
                service.send(Arg.is((email: Email) => {
                    return email.body.templateName === 'lfp-appeal-submission-confirmation';
                })).returns(Promise.reject(Error('Unexpected error')));
            });

            const applicationData = getApplicationData();

            const app = createApp(applicationData, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
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
                { ...getAppeal(), createdBy: { emailAddress: 'test' }, id: '1' },
                token,
                refreshToken
            );
        });
    });
});

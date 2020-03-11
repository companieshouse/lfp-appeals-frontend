import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK } from 'http-status-codes';
import * as request from 'supertest';

import 'app/controllers/CheckYourAppealController';
import { Appeal } from 'app/models/Appeal';
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { AppealSubmissionService } from 'app/service/AppealSubmissionService';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createSubstituteOf } from 'test/SubstituteFactory'
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';

const config = getDefaultConfig();

const appeal = {
    penaltyIdentifier: {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    },
    reasons: {
        other: {
            title: 'I have reasons',
            description: 'they are legit'
        }
    }
} as Appeal;

const token: string = '/T+R3ABq5SPPbZWSeePnrDE1122FEZSAGRuhmn21aZSqm5UQt/wqixlSViQPOrWe2iFb8PeYjZzmNehMA3JCJg==';

describe('CheckYourAppealController', () => {
    describe('GET request', () => {
        it('should return 200 with populated session data', async () => {
            const session = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', appeal);
            const app = createApp(session);

            await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text)
                        .to.contain(appeal.penaltyIdentifier.companyNumber).and
                        .to.contain(appeal.penaltyIdentifier.penaltyReference).and
                        .to.contain('test').and
                        .to.contain(appeal.reasons.other.title).and
                        .to.contain(appeal.reasons.other.description)

                });
        });

        it('should return 200 with no populated session data', async () => {
            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app).get(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK)
                });
        });
    });

    describe('POST request', () => {

        const session = createFakeSession([], config.cookieSecret, true)
            .saveExtraData('appeals', appeal);

        const emailService = createSubstituteOf<EmailService>(service => {
            service.send(Arg.any()).returns(Promise.resolve());
        });

        const appealSubmissionService = createSubstituteOf<AppealSubmissionService>(service => {
            service.submitAppeal(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve());
        });

        let app = createApp(session, container => {
            container.rebind(EmailService).toConstantValue(emailService);
            container.rebind(AppealSubmissionService).toConstantValue(appealSubmissionService);
        });

        it('should redirect to confirmation page when email sending succeeded', async () => {

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(CONFIRMATION_PAGE_URI);
                })
        });

        it('should render error when email sending failed', async () => {
            app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.reject(Error('Unexpected error')));
                }));

                container.rebind(AppealSubmissionService)
                    .toConstantValue(createSubstituteOf<AppealSubmissionService>(service => {
                    service.submitAppeal(Arg.any(), Arg.any(), Arg.any())
                        .returns(Promise.reject(Error('Unexpected error')));
                }));
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
                })
        });

        it('should send confirmation email', async () => {

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

            emailService.received().send({
                to: 'test',
                subject: 'Confirmation of your appeal - 00345567 - Companies House',
                body: {
                    templateName: 'lfp-appeal-submission-confirmation',
                    templateData: {
                        companyNumber: '00345567',
                        userProfile: {
                            email: 'test'
                        }
                    }
                }
            });
        });

        it('should render error when submission of appeal failed', async () => {

            app = createApp(session, container => {

                container.rebind(AppealSubmissionService)
                    .toConstantValue(createSubstituteOf<AppealSubmissionService>(service => {
                        service.submitAppeal(Arg.any(), Arg.any(), Arg.any())
                            .returns(Promise.reject(Error('Unexpected error')));
                    }));

                container.rebind(EmailService).toConstantValue(createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                }));
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
                })
        })

        it('should submit appeal', async () => {

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

            appealSubmissionService.received().submitAppeal(appeal, appeal.penaltyIdentifier.companyNumber, token);

        })
    })
});

import 'reflect-metadata';

import {Arg} from '@fluffy-spoon/substitute'
import {expect} from 'chai';
import {INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK} from 'http-status-codes';
import * as request from 'supertest';

import 'app/controllers/CheckYourAppealController';
import {Appeal} from 'app/models/Appeal';
import {Email} from 'app/modules/email-publisher/Email';
import {EmailService} from 'app/modules/email-publisher/EmailService'
import {AppealStorageService} from 'app/service/AppealStorageService';
import {CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI} from 'app/utils/Paths';

import {createApp, getDefaultConfig} from 'test/ApplicationFactory';
import {createSubstituteOf} from 'test/SubstituteFactory'
import {createFakeSession} from 'test/utils/session/FakeSessionFactory';

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

        it('should send email with appeal to internal team and submission confirmation to user', async () => {
            const emailService = createSubstituteOf<EmailService>(service => {
                service.send(Arg.any()).returns(Promise.resolve());
            });

            const app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

            emailService.received().send(Arg.is((email: Email) => {
                return email.to === 'appeals.ch.fake+DEFAULT@gmail.com'
                    && email.body.templateName === 'lfp-appeal-submission-internal';
            }));
            emailService.received().send(Arg.is((email: Email) => {
                return email.to === 'test'
                    && email.body.templateName === 'lfp-appeal-submission-confirmation';
            }));
        });

        it('should redirect to confirmation page when email sending succeeded', async () => {
            const app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                }));
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(CONFIRMATION_PAGE_URI);
                })
        });

        it('should not send email to user and render error when internal email did not send', async () => {
            const emailService = createSubstituteOf<EmailService>(service => {
                service.send(Arg.any()).returns(Promise.reject(Error('Unexpected error')));
            });
            const app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
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

            const app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(emailService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
                })
        });

        it('should render error when appeal storage failed', async () => {

            const app = createApp(session, container => {

                container.rebind(AppealStorageService)
                    .toConstantValue(createSubstituteOf<AppealStorageService>(service => {
                        service.save(Arg.any(), Arg.any(), Arg.any())
                            .returns(Promise.reject(Error('Unexpected error')));
                    }));
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
                })
        });

        it('should store appeal', async () => {

            const token: string =
                '/T+R3ABq5SPPbZWSeePnrDE1122FEZSAGRuhmn21aZSqm5UQt/wqixlSViQPOrWe2iFb8PeYjZzmNehMA3JCJg==';

            const appealStorageService = createSubstituteOf<AppealStorageService>(service => {
                service.save(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve());
            })

            const app = createApp(session, container => {
                container.rebind(AppealStorageService).toConstantValue(appealStorageService);
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

            appealStorageService.received().save(appeal, appeal.penaltyIdentifier.companyNumber, token);

        });
    })
});

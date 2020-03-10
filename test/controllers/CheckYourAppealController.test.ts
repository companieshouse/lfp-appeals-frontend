import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai';
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY, OK } from 'http-status-codes';
import * as request from 'supertest';

import 'app/controllers/CheckYourAppealController';
import { Appeal } from 'app/models/Appeal';
import { EmailService } from 'app/modules/email-publisher/EmailService'
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

        it('should render error when email sending failed', async () => {
            const app = createApp(session, container => {
                container.rebind(EmailService).toConstantValue(createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.reject(Error('Unexpected error')));
                }));
            });

            await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR)
                })
        });

        describe('sending user emails', () => {
            it('should send confirmation email', async () => {
                const emailService = createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                });

                const app = createApp(session, container => {
                    container.rebind(EmailService).toConstantValue(emailService);
                });

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
            })
        });

        describe('sending internal emails', () => {

            const appealSC = {
                penaltyIdentifier: {
                    companyNumber: 'SC345567',
                    penaltyReference: 'A00000001',
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal;

            const appealNI = {
                penaltyIdentifier: {
                    companyNumber: 'NI345567',
                    penaltyReference: 'A00000001',
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'they are legit'
                    }
                }
            } as Appeal;

            const sessionSC = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', appealSC);

            const sessionNI = createFakeSession([], config.cookieSecret, true)
                .saveExtraData('appeals', appealNI);

            it('should send internal email to default appeals team', async () => {
                const emailService = createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                });

                const app = createApp(session, container => {
                    container.rebind(EmailService).toConstantValue(emailService);
                });

                await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

                emailService.received().send({
                    to: 'appeals.ch.fake+DEFAULT@gmail.com',
                    subject: 'Appeal submitted - 00345567',
                    body: {
                        templateName: 'lfp-appeal-submission-internal',
                        templateData: {
                            companyNumber: '00345567',
                            userProfile: {
                                email: 'test'
                            },
                            reasons: {
                                other: {
                                    title: 'I have reasons',
                                    description: 'they are legit'
                                }
                            }
                        }
                    }
                });
            });

            it('should send internal email to SC appeals team', async () => {
                const emailServiceSC = createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                });

                const app = createApp(sessionSC, container => {
                    container.rebind(EmailService).toConstantValue(emailServiceSC);
                });

                await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

                emailServiceSC.received().send({
                    to: 'appeals.ch.fake+SC@gmail.com',
                    subject: 'Appeal submitted - SC345567',
                    body: {
                        templateName: 'lfp-appeal-submission-internal',
                        templateData: {
                            companyNumber: 'SC345567',
                            userProfile: {
                                email: 'test'
                            },
                            reasons: {
                                other: {
                                    title: 'I have reasons',
                                    description: 'they are legit'
                                }
                            }
                        }
                    }
                });
            });

            it('should send internal email to NI appeals team', async () => {

                const emailServiceNI = createSubstituteOf<EmailService>(service => {
                    service.send(Arg.any()).returns(Promise.resolve());
                });

                const app = createApp(sessionNI, container => {
                    container.rebind(EmailService).toConstantValue(emailServiceNI);
                });

                await request(app).post(CHECK_YOUR_APPEAL_PAGE_URI);

                emailServiceNI.received().send({
                    to: 'appeals.ch.fake+NI@gmail.com',
                    subject: 'Appeal submitted - NI345567',
                    body: {
                        templateName: 'lfp-appeal-submission-internal',
                        templateData: {
                            companyNumber: 'NI345567',
                            userProfile: {
                                email: 'test'
                            },
                            reasons: {
                                other: {
                                    title: 'I have reasons',
                                    description: 'they are legit'
                                }
                            }
                        }
                    }
                });
            });
        })
    })
});

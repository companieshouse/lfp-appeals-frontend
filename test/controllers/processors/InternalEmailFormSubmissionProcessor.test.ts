import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';

import { InternalEmailFormActionProcessor } from 'app/controllers/processors/InternalEmailFormActionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';
import { EmailService } from 'app/modules/email-publisher/EmailService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('InternalEmailFormSubmissionProcessor', () => {
    it('should throw error when session does not exist', async () => {
        const emailService = createSubstituteOf<EmailService>();

        const processor = new InternalEmailFormActionProcessor(emailService);
        try {
            await processor.process({ session: undefined } as Request);
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Session is undefined');
        }

        emailService.didNotReceive().send(Arg.any());
    });

    describe('processing', () => {
        const otherReason = {
            other: {
                title: 'I have reasons',
                description: 'They are legit'
            }
        };
        const illnessReason = {
            illPerson: 'director',
            illnessStart: '01/01/2021',
            illnessImpactFurtherInformation: 'test',
            continuedIllness: 'no'
        } as Illness;
        const attachmentReason = [
            {
                id: '123',
                name: 'evidence.png',
                contentType: 'image/png',
                size: 100,
                url: 'http://localhost/appeal-a-penalty/download/prompt/123?c=12345678'
            }
        ];
        const appealWithoutAttachments: Appeal = {
            id: 'abc',
            createdBy: {
                name: 'name'
            },
            penaltyIdentifier: {
                companyName: 'A Company Name',
                companyNumber: '12345678',
                penaltyReference: 'PEN1A/12345677'
            } as PenaltyIdentifier,
            reasons: otherReason
        };

        const createRequestWithAppealInSession = (appeal: Appeal): Request => {
            return {
                protocol: 'http',
                headers: {
                    host: 'localhost',
                },
                session:
                    new Session({
                        [SessionKey.SignInInfo]: {
                            [SignInInfoKeys.UserProfile]: {
                                email: 'user@example.com'
                            } as IUserProfile
                        } as ISignInInfo,
                        [SessionKey.ExtraData]: {
                            [APPLICATION_DATA_KEY]: { appeal } as ApplicationData
                        }
                    })
            } as Request;
        };

        it('should send email to the team supporting company’s region', async () => {
            const scenarios = [
                { companyNumber: 'SC345567', recipient: 'appeals.ch.fake+SC@gmail.com' },
                { companyNumber: 'NI345567', recipient: 'appeals.ch.fake+NI@gmail.com' },
                { companyNumber: '345567', recipient: 'appeals.ch.fake+DEFAULT@gmail.com' }
            ];
            for (const { companyNumber, recipient } of scenarios) {
                const emailService = createSubstituteOf<EmailService>();

                const processor = new InternalEmailFormActionProcessor(emailService);
                await processor.process(createRequestWithAppealInSession({
                    ...appealWithoutAttachments,
                    penaltyIdentifier: {
                        companyNumber
                    }
                } as Appeal));

                emailService.received().send(Arg.is(arg => arg.to === recipient));
            }
        });

        it('should send right email without attachments', async () => {
            const emailService = createSubstituteOf<EmailService>();

            const processor = new InternalEmailFormActionProcessor(emailService);
            await processor.process(createRequestWithAppealInSession(appealWithoutAttachments));

            emailService.received().send({
                to: 'appeals.ch.fake+DEFAULT@gmail.com',
                subject: `Appeal submitted - 12345678`,
                body: {
                    templateName: 'lfp-appeal-submission-internal',
                    templateData: {
                        companyName: 'A Company Name',
                        companyNumber: '12345678',
                        penaltyReference: 'PEN1A/12345677',
                        userProfile: {
                            email: 'user@example.com'
                        },
                        reasons: {
                            other: {
                                title: 'I have reasons',
                                description: 'They are legit',
                                attachments: undefined
                            }
                        }
                    }
                }
            });
        });

        it('should send right email with attachments', async () => {
            const emailService = createSubstituteOf<EmailService>();

            const processor = new InternalEmailFormActionProcessor(emailService);
            await processor.process(createRequestWithAppealInSession({
                ...appealWithoutAttachments,
                reasons: {
                    ...appealWithoutAttachments.reasons,
                    other: {
                        ...appealWithoutAttachments.reasons.other,
                        attachments: attachmentReason
                    } as OtherReason
                } as Reasons
            }));

            emailService.received().send({
                to: 'appeals.ch.fake+DEFAULT@gmail.com',
                subject: `Appeal submitted - 12345678`,
                body: {
                    templateName: 'lfp-appeal-submission-internal',
                    templateData: {
                        companyName: 'A Company Name',
                        companyNumber: '12345678',
                        penaltyReference: 'PEN1A/12345677',
                        userProfile: {
                            email: 'user@example.com'
                        },
                        reasons: {
                            other: {
                                title: 'I have reasons',
                                description: 'They are legit',
                                attachments: [
                                    {
                                        name: attachmentReason[0].name,
                                        url: `${attachmentReason[0].url}&a=abc`
                                    }
                                ]
                            }
                        }
                    }
                }
            });
        });

        it('should send right email with illness data without attachments', async () => {
            const emailService = createSubstituteOf<EmailService>();

            const processor = new InternalEmailFormActionProcessor(emailService);
            await processor.process(createRequestWithAppealInSession({
                ...appealWithoutAttachments,
                reasons: {
                    illness: illnessReason
                }
            }));

            emailService.received().send({
                to: 'appeals.ch.fake+DEFAULT@gmail.com',
                subject: `Appeal submitted - 12345678`,
                body: {
                    templateName: 'lfp-appeal-submission-internal',
                    templateData: {
                        companyName: 'A Company Name',
                        companyNumber: '12345678',
                        penaltyReference: 'PEN1A/12345677',
                        userProfile: {
                            email: 'user@example.com'
                        },
                        reasons: {
                            illness: {
                                name: 'name',
                                illPerson: 'director',
                                illnessStart: '01/01/2021',
                                description: 'test',
                                attachments: undefined
                            }
                        }
                    }
                }
            });
        });
    });
});

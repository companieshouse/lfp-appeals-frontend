import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Maybe, Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';

import { InternalEmailFormActionProcessor } from 'app/controllers/processors/InternalEmailFormActionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { EmailService } from 'app/modules/email-publisher/EmailService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('InternalEmailFormSubmissionProcessor', () => {
    it('should throw error when session does not exist', async () => {
        const emailService = createSubstituteOf<EmailService>();

        const processor = new InternalEmailFormActionProcessor(emailService);
        try {
            await processor.process({ session: Maybe.empty() as Maybe<Session> } as Request);
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Maybe got coerced to a null');
        }

        emailService.didNotReceive().send(Arg.any());
    });

    it('should send right email to the team supporting company’s region', async () => {
        const scenarios = [
            { companyNumber: 'SC345567', recipient: 'appeals.ch.fake+SC@gmail.com' },
            { companyNumber: 'NI345567', recipient: 'appeals.ch.fake+NI@gmail.com' },
            { companyNumber: '345567', recipient: 'appeals.ch.fake+DEFAULT@gmail.com' }
        ];
        for (const { companyNumber, recipient } of scenarios) {
            const emailService = createSubstituteOf<EmailService>();

            const processor = new InternalEmailFormActionProcessor(emailService);
            await processor.process({
                session: Maybe.of(
                    new Session({
                        [SessionKey.SignInInfo]: {
                            [SignInInfoKeys.UserProfile]: {
                                email: 'user@example.com'
                            } as IUserProfile
                        } as ISignInInfo,
                        [SessionKey.ExtraData]: {
                            [APPLICATION_DATA_KEY]: {
                                appeal: {
                                    penaltyIdentifier: {
                                        companyNumber
                                    },
                                    reasons: {
                                        other: {
                                            title: 'I have reasons',
                                            description: 'They are legit'
                                        }
                                    }
                                } as Appeal
                            } as ApplicationData
                        }
                    })
                )
            } as Request);

            emailService.received().send({
                to: recipient,
                subject: `Appeal submitted - ${companyNumber}`,
                body: {
                    templateName: 'lfp-appeal-submission-internal',
                    templateData: {
                        companyNumber,
                        userProfile: {
                            email: 'user@example.com'
                        },
                        reasons: {
                            other: {
                                title: 'I have reasons',
                                description: 'They are legit'
                            }
                        }
                    }
                }
            });
        }
    });
});

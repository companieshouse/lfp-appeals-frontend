import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Maybe, Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';

import { InternalEmailFormSubmissionProcessor } from 'app/controllers/processors/InternalEmailFormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('InternalEmailFormSubmissionProcessor', () => {
    loadEnvironmentVariablesFromFiles();

    it('should throw error when session does not exist', async () => {
        const emailService = createSubstituteOf<EmailService>();

        const processor = new InternalEmailFormSubmissionProcessor(emailService);
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

            const processor = new InternalEmailFormSubmissionProcessor(emailService);
            await processor.process({
                session: Maybe.of(
                    new Session({
                        [SessionKey.SignInInfo]: {
                            [SignInInfoKeys.UserProfile]: {
                                email: 'user@example.com'
                            } as IUserProfile
                        } as ISignInInfo,
                        [SessionKey.ExtraData]: {
                            [APPEALS_KEY]: {
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

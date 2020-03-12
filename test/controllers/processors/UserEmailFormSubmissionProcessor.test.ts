import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Maybe, Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';

import { UserEmailFormSubmissionProcessor } from 'app/controllers/processors/UserEmailFormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { EmailService } from 'app/modules/email-publisher/EmailService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('UserEmailFormSubmissionProcessor', () => {
    it('should throw error when session does not exist', async () => {
        const emailService = createSubstituteOf<EmailService>();

        const processor = new UserEmailFormSubmissionProcessor(emailService);
        try {
            await processor.process({ session: Maybe.empty() as Maybe<Session> } as Request);
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Maybe got coerced to a null');
        }

        emailService.didNotReceive().send(Arg.any());
    });

    it('should send right email to logged in user', async () => {
        const emailService = createSubstituteOf<EmailService>();

        const processor = new UserEmailFormSubmissionProcessor(emailService);
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
                                companyNumber: '00345567'
                            }
                        } as Appeal
                    }
                })
            )
        } as Request);

        emailService.received().send({
            to: 'user@example.com',
            subject: 'Confirmation of your appeal - 00345567 - Companies House',
            body: {
                templateName: 'lfp-appeal-submission-confirmation',
                templateData: {
                    companyNumber: '00345567',
                    userProfile: {
                        email: 'user@example.com'
                    }
                }
            }
        });
    })
});
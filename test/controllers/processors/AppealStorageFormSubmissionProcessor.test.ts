import 'reflect-metadata';

import { Arg } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { IAccessToken, ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';

import { AppealStorageFormActionProcessor } from 'app/controllers/processors/AppealStorageFormActionProcessor';
import { Appeal } from 'app/models/Appeal';
import { APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('AppealStorageForSubmissionProcessor', () => {

    const appealsService = createSubstituteOf<AppealsService>();

    const processor = new AppealStorageFormActionProcessor(appealsService);

    const appeal: Appeal = {
        penaltyIdentifier: {
            companyNumber: '00345567',
            penaltyReference: 'A00000001',
        },
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'they are legit'
            }
        },
        createdBy: {
            emailAddress: 'email@email.com'
        }
    };

    const accessToken: string = 'abc';
    const refreshToken: string = 'xyz';

    it('should throw error when session does not exist', async () => {

        try {
            await processor.process({session: undefined} as Request);
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Session is undefined');
        }

        appealsService.didNotReceive().save(Arg.any(), Arg.any(), Arg.any());
    });

    it('should store appeal', async () => {

        await processor.process({
            session:
                new Session({
                    [SessionKey.SignInInfo]: {
                        [SignInInfoKeys.UserProfile]: {
                            emailAddress: 'email@email.com'
                        } as IUserProfile,
                        [SignInInfoKeys.AccessToken]: {
                            access_token: accessToken,
                            refresh_token: refreshToken
                        } as IAccessToken
                    } as ISignInInfo,
                    [SessionKey.ExtraData]: {
                        [APPLICATION_DATA_KEY]: {
                           appeal
                        }
                    }
                })

        } as Request);

        appealsService.received().save(appeal, accessToken, refreshToken);
    });
});

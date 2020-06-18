import Substitute, { Arg, SubstituteOf } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { IAccessToken, ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';

import { CheckForDuplicateMiddleware } from 'app/middleware/CheckForDuplicateMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('CheckForDuplicateMiddleware', () => {

    const accessTokenData: IAccessToken = {
        access_token: 'abc',
        refresh_token: 'xyz'
    };

    const appeal: Appeal = {
        penaltyIdentifier: {
            companyNumber: 'SC123123',
            userInputPenaltyReference: 'A1231234',
            penaltyReference: 'A1231234'
        },
        reasons: {
            other: {
                title: '',
                description: ''
            }
        }
    };

    const createAppealService = (method: 'resolves' | 'rejects', data?: Appeal | any): SubstituteOf<AppealsService> => {
        const service = Substitute.for<AppealsService>();
        service.hasExistingAppeal(Arg.all())[method](data);
        return service;
    };

    const getRequestSubstitute = (appData: Partial<ApplicationData>, accessToken: IAccessToken): Request => {
        return {
            session:
                new Session({
                    [SessionKey.SignInInfo]: {
                        [SignInInfoKeys.AccessToken]: accessToken
                    } as ISignInInfo,
                    [SessionKey.ExtraData]: {
                        [APPLICATION_DATA_KEY]: {
                            ...appData
                        }
                    }
                })
        } as Request;
    };

    it('should throw an error when session is undefined', async () => {
        const appealService = createAppealService('rejects');
        const checkForDuplicateMiddleware = new CheckForDuplicateMiddleware(appealService);

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = {session: undefined} as Request;

        try {
            console.log(await checkForDuplicateMiddleware.handler(request, response, nextFunction));
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Session is undefined');
        }

        appealService.didNotReceive().hasExistingAppeal(Arg.all());

    });

    it('should throw an error when access token is undefined', async () => {

        const appData = { appeal };

        const appealService = createAppealService('resolves', {});
        const checkForDuplicateMiddleware = new CheckForDuplicateMiddleware(appealService);

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData, {});

        try {
            await checkForDuplicateMiddleware.handler(request, response, nextFunction);
            assert.fail();
        } catch (err) {
            assert.equal(err.message, 'Access token missing from session');
        }

        appealService.didNotReceive().hasExistingAppeal(Arg.all());

    });

    it('should call next when the user does not have a duplicate appeal', async () => {

        const appData = { appeal };

        const appealService = createAppealService('resolves', false);
        const checkForDuplicateMiddleware = new CheckForDuplicateMiddleware(appealService);

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData, accessTokenData);

        await checkForDuplicateMiddleware.handler(request, response, nextFunction);
        appealService.received().hasExistingAppeal(Arg.all());
        nextFunction.received(1);

    });

    it('should not call next when the user does have a duplicate appeal', async () => {

        const appData = { appeal };

        const appealService = createAppealService('resolves', true);
        const checkForDuplicateMiddleware = new CheckForDuplicateMiddleware(appealService);

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData,accessTokenData);

        await checkForDuplicateMiddleware.handler(request, response, nextFunction);
        appealService.received().hasExistingAppeal(Arg.all());
        nextFunction.didNotReceive();

    });
});

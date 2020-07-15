import 'reflect-metadata';

import { Arg} from '@fluffy-spoon/substitute';
import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';

import 'app/controllers/index';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('Company Authentication Middleware', () => {

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

    it('should call next with an error when session is undefined', async () => {

        const companyAuthMiddleware = new CompanyAuthMiddleware();

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = { session: undefined } as Request;

        try{
            await companyAuthMiddleware.handler(request, response, nextFunction);
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }
    });


    it('should call next if the user is authorized for company number', async () => {

        const appData = { appeal };

        const companyAuthMiddleware = new CompanyAuthMiddleware();

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData, appeal.penaltyIdentifier.companyNumber);

        await companyAuthMiddleware.handler(request, response, nextFunction);
        nextFunction.received(1);
        response.didNotReceive().redirect(Arg.any());

    });
});

const getRequestSubstitute = (appData: Partial<ApplicationData>, companyNumber: string): Request => {
    return {
        session:
            new Session({
                [SessionKey.SignInInfo]: {
                    'company_number': companyNumber
                } as ISignInInfo,
                [SessionKey.ExtraData]: {
                    [APPLICATION_DATA_KEY]: {
                        ...appData
                    }
                }
            })
    } as Request;
};

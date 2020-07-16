import 'reflect-metadata';

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import { Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';

import 'app/controllers/index';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import CompanyAuthConfig from 'app/models/CompanyAuthConfig';
import JwtEncryptionService from 'app/modules/jwt-encryption-service/JwtEncryptionService';
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

    const companyAuthConfig: CompanyAuthConfig = {
        oath_scope_prefix: 'MOCK',
        accountUrl: 'MOCK',
        accountRequestKey: 'MOCK',
        accountClientId: 'MOCK',
        chsUrl: 'MOCK',
    };

    const sessionStoreForAuthConfig = {
        sessionCookieName: '__SID',
        sessionCookieDomain: 'rebel1.aws.chdev.org',
        sessionCookieSecureFlag: 'true',
        sessionTimeToLiveInSeconds: 3600
    };

    it('should call next with an error when session is undefined', async () => {

        const encryptionService = createEncryptionService('resolves');

        const sessionStore = Substitute.for<SessionStore>();
        const companyAuthMiddleware =
            new CompanyAuthMiddleware(encryptionService, sessionStore, companyAuthConfig, sessionStoreForAuthConfig);

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

        const encryptionService = createEncryptionService('resolves');

        const sessionStore = Substitute.for<SessionStore>();
        const companyAuthMiddleware =
            new CompanyAuthMiddleware(encryptionService, sessionStore, companyAuthConfig, sessionStoreForAuthConfig);

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData, appeal.penaltyIdentifier.companyNumber);

        await companyAuthMiddleware.handler(request, response, nextFunction);
        nextFunction.received(1);
        response.didNotReceive().redirect(Arg.any());

    });

    it('should redirect if the user is not authorized for company number', async () => {

        const appData = { appeal };

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = getRequestSubstitute(appData, '');

        const encryptionService = createEncryptionService('resolves', 'a_sequence');

        const sessionStore = Substitute.for<SessionStore>();

        const companyAuthMiddleware =
            new CompanyAuthMiddleware(encryptionService, sessionStore, companyAuthConfig, sessionStoreForAuthConfig);

        await companyAuthMiddleware.handler(request, response, nextFunction);
        nextFunction.didNotReceive();
        response.received(1).redirect(Arg.any());

    });
});

const createEncryptionService = (method: 'resolves' | 'rejects', encoded?: string | any)
    : SubstituteOf<JwtEncryptionService> => {

    const service = Substitute.for<JwtEncryptionService>();
    service.jweEncodeWithNonce(Arg.all())[method](encoded);
    return service;
};

const getRequestSubstitute = (appData: Partial<ApplicationData>, companyNumber: string): Request => {
    return {
        cookies: {
            '__SID': '1'.repeat(55)
        },
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

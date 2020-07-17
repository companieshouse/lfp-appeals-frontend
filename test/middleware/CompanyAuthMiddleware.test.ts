import 'reflect-metadata';

import { Arg, Substitute} from '@fluffy-spoon/substitute';
import { Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';

import 'app/controllers/index';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CompanyAuthConfig } from 'app/models/CompanyAuthConfig';
import { JwtEncryptionService } from 'app/modules/jwt-encryption-service/JwtEncryptionService';
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
        accountUrl: 'mock_domain_url',
        accountRequestKey: 'mock_key',
        accountClientId: 'mock_id',
        chsUrl: 'mock_url',
    };

    const sessionStoreForAuthConfig = {
        sessionCookieName: '__SID',
        sessionCookieDomain: 'rebel1.aws.chdev.org',
        sessionCookieSecureFlag: 'true',
        sessionTimeToLiveInSeconds: 3600
    };

    const redirectUrl: string = 'mock_domain_url/oauth2/authorise?client_id=mock_id&redirect_uri=mock_url/oauth2/user/callback&response_type=code&scope=https://api.companieshouse.gov.uk/company/SC123123&state=';

    const featureFlag: boolean = true;

    it('should throw error when session is undefined', async () => {

        const encryptionService = createSubstituteOf<JwtEncryptionService>(service => {
            service.encrypt(Arg.any()).resolves('');
        });

        const sessionStore = Substitute.for<SessionStore>();
        const companyAuthMiddleware = new CompanyAuthMiddleware(
            sessionStore,
            encryptionService,
            companyAuthConfig,
            sessionStoreForAuthConfig,
            featureFlag
        );

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = { session: undefined } as Request;

        try{
            await companyAuthMiddleware.handler(request, response, nextFunction);
        } catch (err) {
            expect(err).to.equal(SESSION_NOT_FOUND_ERROR);
        }

    });

    it('should call next with a feature flag is set to false', async () => {

        const flag = false;

        const encryptionService = createSubstituteOf<JwtEncryptionService>(service => {
            service.encrypt(Arg.any()).resolves('');
        });

        const sessionStore = Substitute.for<SessionStore>();
        const companyAuthMiddleware = new CompanyAuthMiddleware(
            sessionStore,
            encryptionService,
            companyAuthConfig,
            sessionStoreForAuthConfig,
            flag
        );

        const nextFunction = createSubstituteOf<NextFunction>();
        const response = createSubstituteOf<Response>();
        const request = { session: undefined } as Request;

        await companyAuthMiddleware.handler(request, response, nextFunction);
        nextFunction.received(1);
        response.didNotReceive().redirect(Arg.any());
    });


    it('should call next if the user is authorized for company number', async () => {

        const appData = { appeal };

        const encryptionService = createSubstituteOf<JwtEncryptionService>(service => {
            service.encrypt(Arg.any()).resolves('');
        });

        const sessionStore = Substitute.for<SessionStore>();
        const companyAuthMiddleware = new CompanyAuthMiddleware(
            sessionStore,
            encryptionService,
            companyAuthConfig,
            sessionStoreForAuthConfig,
            featureFlag
        );

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

        const encryptionService = createSubstituteOf<JwtEncryptionService>(service => {
            service.encrypt(Arg.any()).resolves('MOCK');
        });

        const sessionStore = Substitute.for<SessionStore>();

        const companyAuthMiddleware = new CompanyAuthMiddleware(
            sessionStore,
            encryptionService,
            companyAuthConfig,
            sessionStoreForAuthConfig,
            featureFlag
        );

        const startingWithRedirectUrl = (redirect : string) => redirect.startsWith(redirectUrl);

        await companyAuthMiddleware.handler(request, response, nextFunction);
        nextFunction.didNotReceive();
        response.received(1).redirect(Arg.is(startingWithRedirectUrl));

    });
});

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

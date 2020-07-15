
import { Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import Container = interfaces.Container;
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { interfaces } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import CompanyAuthConfig from 'app/models/CompanyAuthConfig';
import { Mutable } from 'app/models/Mutable';
import JwtEncryptionService from 'app/modules/jwt-encryption-service/jwtEncryptionService';
import jwtEncryptionService from 'app/modules/jwt-encryption-service/jwtEncryptionService';
import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const OATH_SCOPE_PREFIX = 'https://api.companieshouse.gov.uk/company/';
const sessionCookieName = getEnvOrThrow('COOKIE_NAME');
const sessionCookieDomain = getEnvOrThrow('COOKIE_DOMAIN');
const sessionCookieSecureFlag = getEnvOrDefault('COOKIE_SECURE_ONLY', 'true');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10);

@provide(CompanyAuthMiddleware)
export class CompanyAuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        if (!req.session) {
            return next(new Error('Session is undefined'));
        }

        const applicationData: ApplicationData = req.session
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const companyNumber: string = applicationData.appeal.penaltyIdentifier.companyNumber;

        const signInInfo: ISignInInfo | undefined = req.session.get<ISignInInfo>(SessionKey.SignInInfo);

        if (isAuthorisedForCompany(signInInfo, companyNumber)){
            loggerInstance().info(`User is authenticated for ${companyNumber}`);
            return next();
        }



        const companyAuthConfig: CompanyAuthConfig = {
            accountUrl: 'http://account.chs.local',
            accountRequestKey: getEnvOrThrow('OAUTH2_REQUEST_KEY'),
            accountClientId: getEnvOrThrow('OAUTH2_CLIENT_ID'),
            chsUrl: 'http://chs.local'
        };

        const encryptionService = new jwtEncryptionService(companyAuthConfig);

        try {
            const uri = await getAuthRedirectUri(req, res,
                companyAuthConfig,
                encryptionService,
                companyNumber,
                this.httpContext.container
            );

            loggerInstance().debug(`Redirecting to ${uri}`);
            return res.redirect(uri);
        } catch (err){
            next(err);
        }
    }
}

function isAuthorisedForCompany(signInInfo: any, companyNumber: string): boolean {
    return signInInfo.company_number === companyNumber;
}

async function getAuthRedirectUri(req: Request, res: Response, companyAuthConfig: CompanyAuthConfig,
                                  encryptionService: JwtEncryptionService,
                                  companyNumber: string, container: Container): Promise<string> {

    const originalUrl: string = req.originalUrl;
    const scope: string = OATH_SCOPE_PREFIX + companyNumber;
    const nonce: string = encryptionService.generateNonce();

    const encodedNonce: string = await encryptionService.jweEncodeWithNonce(originalUrl, nonce);

    // Change the session
    const mutableSession = req.session as Mutable<Session>;
    mutableSession.data[SessionKey.OAuth2Nonce] = nonce;
    req.session = mutableSession as Session;

    // Persist session
    await container.get(SessionStore)
        .store(Cookie.createFrom(req.cookies[sessionCookieName]), mutableSession!.data,
            sessionTimeToLiveInSeconds);

    res.cookie(sessionCookieName, req.cookies[sessionCookieName], {
            domain: sessionCookieDomain,
            path: '/',
            httpOnly: true,
            secure: sessionCookieSecureFlag === 'true',
            maxAge: sessionTimeToLiveInSeconds * 1000,
            encode: String
        });


    console.log(req.session);

    return createAuthUri(encodedNonce, companyAuthConfig, scope);
}

function createAuthUri(encodedNonce: string, companyAuthConfig: CompanyAuthConfig, scope: string): string {

    return `${companyAuthConfig.accountUrl}/oauth2/authorise`.concat(
        '?',
        `client_id=${companyAuthConfig.accountClientId}`,
        `&redirect_uri=${companyAuthConfig.chsUrl}/oauth2/user/callback`,
        `&response_type=code`,
        `&scope=${scope}`,
        `&state=${encodedNonce}`);
}

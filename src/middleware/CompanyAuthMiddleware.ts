
import { Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { inject} from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Mutable } from 'app/models/Mutable';
import JwtEncryptionService from 'app/modules/jwt-encryption-service/JwtEncryptionService';
import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const OATH_SCOPE_PREFIX = getEnvOrThrow('OATH_SCOPE_PREFIX');

const ACCOUNT_WEB_URL= getEnvOrThrow('ACCOUNT_WEB_URL');
const ACCOUNT_URL = getEnvOrThrow('ACCOUNT_URL');
const ACCOUNT_CLIENT_ID = getEnvOrThrow('OAUTH2_CLIENT_ID');

const sessionCookieName = getEnvOrThrow('COOKIE_NAME');
const sessionCookieDomain = getEnvOrThrow('COOKIE_DOMAIN');
const sessionCookieSecureFlag = getEnvOrDefault('COOKIE_SECURE_ONLY', 'true');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10);

const COMPANY_AUTH_FEATURE_FLAG = getEnvOrThrow('COMPANY_AUTH_FEATURE_FLAG');

@provide(CompanyAuthMiddleware)
export class CompanyAuthMiddleware extends BaseMiddleware {

    constructor(@inject(JwtEncryptionService) private readonly encryptionService: JwtEncryptionService,
                @inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    public handler: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        if(COMPANY_AUTH_FEATURE_FLAG === '0'){
            return next();
        }

        if (!req.session) {
            return next(new Error('Session Expected but was undefined'));
        }

        const applicationData: ApplicationData = req.session
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const companyNumber: string = applicationData.appeal.penaltyIdentifier.companyNumber;
        const signInInfo: ISignInInfo | undefined = req.session.get<ISignInInfo>(SessionKey.SignInInfo);

        if (this.isAuthorisedForCompany(signInInfo, companyNumber)){
            loggerInstance().info(`CompanyAuthMiddleware: User is authenticated for ${companyNumber}`);
            return next();
        }

        try {
            const uri = await this.getAuthRedirectUri(req, res, companyNumber);

            loggerInstance().debug(`CompanyAuthMiddleware: Redirecting to ${uri}`);
            return res.redirect(uri);

        } catch (err){
            next(err);
        }
    }

    async getAuthRedirectUri(req: Request, res: Response, companyNumber: string): Promise<string> {

        const originalUrl: string = req.originalUrl;
        const scope: string = OATH_SCOPE_PREFIX + companyNumber;
        const nonce: string = this.encryptionService.generateNonce();
        const encodedNonce: string = await this.encryptionService.jweEncodeWithNonce(originalUrl, nonce);

        const mutableSession = req.session as Mutable<Session>;
        mutableSession.data[SessionKey.OAuth2Nonce] = nonce;

        await this.persistMutableSession(req, res, mutableSession);

        return `${ACCOUNT_URL}/oauth2/authorise`.concat(
            '?',
            `client_id=${ACCOUNT_CLIENT_ID}`,
            `&redirect_uri=${ACCOUNT_WEB_URL}/oauth2/user/callback`,
            `&response_type=code`,
            `&scope=${scope}`,
            `&state=${encodedNonce}`);

    }

    isAuthorisedForCompany(signInInfo: any, companyNumber: string): boolean {

        return signInInfo.company_number === companyNumber;

    }

    async persistMutableSession(req: Request, res: Response,
                                         mutableSession: Mutable<Session>): Promise<void> {

        await this.sessionStore
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

    }

}

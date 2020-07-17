
import { Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CompanyAuthConfig } from 'app/models/CompanyAuthConfig';
import { Mutable } from 'app/models/Mutable';
import { SessionStoreConfig } from 'app/models/SessionConfig';
import { JwtEncryptionService } from 'app/modules/jwt-encryption-service/JwtEncryptionService';

export class CompanyAuthMiddleware extends BaseMiddleware {

    constructor(private readonly sessionStore: SessionStore,
                private readonly encryptionService: JwtEncryptionService,
                private readonly authConfig: CompanyAuthConfig,
                private readonly sessionStoreConfig: SessionStoreConfig,
                private readonly featureFlagEnabled: boolean) {
        super();
    }

    public handler: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        if (!this.featureFlagEnabled) {
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

        } catch (err) {
            next(err);
        }
    }

    async getAuthRedirectUri(req: Request, res: Response, companyNumber: string): Promise<string> {

        const originalUrl: string = req.originalUrl;
        const scope: string = this.authConfig.oathScopePrefix + companyNumber;
        const nonce: string = this.encryptionService.generateNonce();
        const encodedNonce: string = await this
            .encryptionService.encrypt({content: originalUrl, nonce}, this.authConfig.accountRequestKey);

        const mutableSession = req.session as Mutable<Session>;
        mutableSession.data[SessionKey.OAuth2Nonce] = nonce;

        await this.persistMutableSession(req, res, mutableSession);

        return `${this.authConfig.accountUrl}/oauth2/authorise`.concat(
            '?',
            `client_id=${this.authConfig.accountClientId}`,
            `&redirect_uri=${this.authConfig.chsUrl}/oauth2/user/callback`,
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
            .store(Cookie.createFrom(req.cookies[this.sessionStoreConfig.sessionCookieName]), mutableSession!.data,
                this.sessionStoreConfig.sessionTimeToLiveInSeconds);

        res.cookie(this.sessionStoreConfig.sessionCookieName, req.cookies[this.sessionStoreConfig.sessionCookieName], {
            domain: this.sessionStoreConfig.sessionCookieDomain,
            path: '/',
            httpOnly: true,
            secure: this.sessionStoreConfig.sessionCookieSecureFlag === 'true',
            maxAge: this.sessionStoreConfig.sessionTimeToLiveInSeconds * 1000,
            encode: String
        });

    }

}

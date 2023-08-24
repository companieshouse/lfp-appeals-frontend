import { Session, SessionStore } from "@companieshouse/node-session-handler";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { Cookie } from "@companieshouse/node-session-handler/lib/session/model/Cookie";
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { BaseMiddleware } from "inversify-express-utils";

import { loggerInstance } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { CompanyAuthConfig } from "app/models/CompanyAuthConfig";
import { Mutable } from "app/models/Mutable";
import { SessionStoreConfig } from "app/models/SessionConfig";
import { JwtEncryptionService } from "app/modules/jwt-encryption-service/JwtEncryptionService";
import { PENALTY_DETAILS_PAGE_URI } from "app/utils/Paths";

const oathScopePrefix: string = "https://api.companieshouse.gov.uk/company/";

export class CompanyAuthMiddleware extends BaseMiddleware {

    constructor (private readonly sessionStore: SessionStore,
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
            return next(new Error("Session Expected but was undefined"));
        }

        const applicationData: ApplicationData = req.session
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData.appeal;
        if (!appeal) {
            loggerInstance().info(`CompanyAuthMiddleware: Appeal data not found in session, redirecting to ${PENALTY_DETAILS_PAGE_URI}`);
            return res.redirect(PENALTY_DETAILS_PAGE_URI);
        }

        const companyNumber: string = appeal.penaltyIdentifier?.companyNumber;
        const signInInfo: ISignInInfo | undefined = req.session.get<ISignInInfo>(SessionKey.SignInInfo);

        if (this.isAuthorisedForCompany(signInInfo, companyNumber)) {
            loggerInstance().info(`CompanyAuthMiddleware: User is authenticated for ${companyNumber}`);
            return next();
        }

        try {
            const uri = await this.getAuthRedirectUri(req, companyNumber);

            loggerInstance().debug(`CompanyAuthMiddleware: Redirecting to ${uri}`);
            return res.redirect(uri);

        } catch (err) {
            next(err);
        }
    };

    async getAuthRedirectUri (req: Request, companyNumber: string): Promise<string> {

        const originalUrl: string = req.originalUrl;
        const scope: string = oathScopePrefix + companyNumber;
        const nonce: string = this.encryptionService.generateNonce();
        const encodedNonce: string = await this
            .encryptionService.encrypt({ content: originalUrl, nonce }, this.authConfig.accountRequestKey);

        const mutableSession = req.session as Mutable<Session>;
        mutableSession.data[SessionKey.OAuth2Nonce] = nonce;

        return `${this.authConfig.accountUrl}/oauth2/authorise`.concat(
            "?",
            `client_id=${this.authConfig.accountClientId}`,
            `&redirect_uri=${this.authConfig.chsUrl}/oauth2/user/callback`,
            `&response_type=code`,
            `&scope=${scope}`,
            `&state=${encodedNonce}`);

    }

    isAuthorisedForCompany (signInInfo: any, companyNumber: string): boolean {

        return signInInfo.company_number === companyNumber;

    }

    async persistMutableSession (req: Request, res: Response,
        mutableSession: Mutable<Session>): Promise<void> {

        await this.sessionStore
            .store(Cookie.createFrom(req.cookies[this.sessionStoreConfig.sessionCookieName]), mutableSession!.data,
                this.sessionStoreConfig.sessionTimeToLiveInSeconds);

        res.cookie(this.sessionStoreConfig.sessionCookieName, req.cookies[this.sessionStoreConfig.sessionCookieName], {
            domain: this.sessionStoreConfig.sessionCookieDomain,
            path: "/",
            httpOnly: true,
            secure: this.sessionStoreConfig.sessionCookieSecureFlag === "true",
            maxAge: this.sessionStoreConfig.sessionTimeToLiveInSeconds * 1000,
            encode: String
        });

    }

}

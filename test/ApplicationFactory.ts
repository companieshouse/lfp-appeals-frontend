import { Session, SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { Cookie } from "@companieshouse/node-session-handler/lib/session/model/Cookie";
import Substitute from "@fluffy-spoon/substitute";
import { Application, NextFunction, Request, Response } from "express";
import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";

import { ApplicationFactory } from "app/ApplicationFactory";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { CompanyAuthConfig } from "app/models/CompanyAuthConfig";
import { PenaltyIdentifierSchemaFactory } from "app/models/PenaltyIdentifierSchemaFactory";
import { SessionStoreConfig } from "app/models/SessionConfig";
import { CompaniesHouseSDK } from "app/modules/Types";
import { AppealsService } from "app/modules/appeals-service/AppealsService";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { JwtEncryptionService } from "app/modules/jwt-encryption-service/JwtEncryptionService";
import { RefreshTokenService } from "app/modules/refresh-token-service/RefreshTokenService";
import { getEnvOrThrow } from "app/utils/EnvironmentUtils";

import { createSession } from "test/utils/session/SessionFactory";

// tslint:disable-next-line:no-empty
export const createAppConfigurable = (configureBindings: (container: Container) => void = () => { }): Application => {

    const container = new Container();
    container.load(buildProviderModule());
    configureBindings(container);
    return ApplicationFactory.createInstance(container);
};

export const createApp = (data?: Partial<ApplicationData>,
    // tslint:disable-next-line:no-empty
    configureBindings: (container: Container) => void = () => { },
    configureSession: (session: Session) => Session = (_: Session) => _) =>
    createAppConfigurable(container => {

        const cookieName = getEnvOrThrow("COOKIE_NAME");
        const cookieSecret = getEnvOrThrow("COOKIE_SECRET");
        const cookieDomain = getEnvOrThrow("COOKIE_DOMAIN");

        const session: Session | undefined = data ? configureSession(createSession(cookieSecret)) : undefined;
        session?.setExtraData(APPLICATION_DATA_KEY, data);

        // @ts-ignore
        session?.data.signin_info.company_number = "NI000000";

        const sessionId = session?.data[SessionKey.Id];
        const signature = session?.data[SessionKey.ClientSig];

        const cookie = session ? Cookie.createFrom(sessionId! + signature) : null;

        const sessionStore = Substitute.for<SessionStore>();
        const sessionConfig: SessionStoreConfig = SessionStoreConfig.createFromEnvironmentVariables();
        const encryptionService = new JwtEncryptionService();
        const companyAuthConfig: CompanyAuthConfig = {
            accountUrl: "http://account.chs",
            accountRequestKey: "aaa+aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=",
            accountClientId: "test",
            chsUrl: "http://chs"
        };

        if (session && cookie) {
            sessionStore.load(cookie).resolves(session.data);
        }

        container.bind(SessionMiddleware).toConstantValue((req: Request, res: Response, next: NextFunction) => {
            if (session && cookie) {
                req.cookies[cookieName] = cookie.value;
            }
            SessionMiddleware({ cookieName, cookieSecret, cookieDomain }, sessionStore)(req, res, next);
        });

        container.bind(CompanyAuthMiddleware)
            .toConstantValue(new CompanyAuthMiddleware(
                sessionStore,
                encryptionService,
                companyAuthConfig,
                sessionConfig,
                true));

        container.bind(SessionStore).toConstantValue(sessionStore);
        container.bind(AppealsService).toConstantValue(Substitute.for<AppealsService>());
        container.bind(FileTransferService).toConstantValue(Substitute.for<FileTransferService>());
        container.bind(RefreshTokenService).toConstantValue(Substitute.for<RefreshTokenService>());
        container.bind(CompaniesHouseSDK).toConstantValue(Substitute.for<CompaniesHouseSDK>());
        container.bind(PenaltyIdentifierSchemaFactory)
            .toConstantValue(Substitute.for<PenaltyIdentifierSchemaFactory>());
        container.bind(JwtEncryptionService).toConstantValue(Substitute.for<JwtEncryptionService>());

        configureBindings(container);
    });

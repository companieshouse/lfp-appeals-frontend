import { CookieConfig, SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import IORedis from "ioredis";
import { CompaniesHouseSDK } from "modules/Types";

import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { CompanyAuthConfig } from "app/models/CompanyAuthConfig";
import { PenaltyIdentifierSchemaFactory } from "app/models/PenaltyIdentifierSchemaFactory";
import { SessionStoreConfig } from "app/models/SessionConfig";
import { AppealsService } from "app/modules/appeals-service/AppealsService";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { JwtEncryptionService } from "app/modules/jwt-encryption-service/JwtEncryptionService";
import { RefreshTokenService } from "app/modules/refresh-token-service/RefreshTokenService";
import { getEnvOrDefault, getEnvOrThrow } from "app/utils/EnvironmentUtils";

export function createContainer (): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: getEnvOrThrow("COOKIE_NAME"),
        cookieSecret: getEnvOrThrow("COOKIE_SECRET"),
        cookieDomain: getEnvOrThrow("COOKIE_DOMAIN")
    };
    const sessionStore = new SessionStore(new IORedis(`${getEnvOrThrow("CACHE_SERVER")}`));
    container.bind(SessionStore).toConstantValue(sessionStore);
    container.bind(SessionMiddleware).toConstantValue(SessionMiddleware(config, sessionStore));
    container.bind(CsrfProtectionMiddleware).toConstantValue(CsrfProtectionMiddleware(
        {
            sessionStore,
            enabled: true,
            sessionCookieName: config.cookieName
        }
    ));

    const refreshTokenService = new RefreshTokenService(getEnvOrThrow(`OAUTH2_TOKEN_URI`),
        getEnvOrThrow(`OAUTH2_CLIENT_ID`),
        getEnvOrThrow(`OAUTH2_CLIENT_SECRET`));

    container.bind(RefreshTokenService).toConstantValue(
        refreshTokenService);

    container.bind(AppealsService).toConstantValue(
        new AppealsService(getEnvOrThrow(`APPEALS_API_URL`), refreshTokenService));

    container.bind(FileTransferService).toConstantValue(
        new FileTransferService(getEnvOrThrow(`FILE_TRANSFER_API_URL`),
            getEnvOrThrow(`FILE_TRANSFER_API_KEY`)));

    container.bind(CompaniesHouseSDK).toConstantValue(CompaniesHouseSDK(getEnvOrThrow("API_URL")));

    container.bind(PenaltyIdentifierSchemaFactory)
        .toConstantValue(new PenaltyIdentifierSchemaFactory(getEnvOrThrow("ALLOWED_COMPANY_PREFIXES")));

    const companyAuthConfig: CompanyAuthConfig = {
        accountUrl: getEnvOrThrow("ACCOUNT_PRIVATE_URL"),
        accountRequestKey: getEnvOrThrow("OAUTH2_REQUEST_KEY"),
        accountClientId: getEnvOrThrow("OAUTH2_CLIENT_ID"),
        chsUrl: getEnvOrThrow("CHS_URL")
    };

    const sessionConfig: SessionStoreConfig = SessionStoreConfig.createFromEnvironmentVariables();
    const encryptionService = new JwtEncryptionService();
    const companyAuthFeatureEnabled = Number(getEnvOrDefault("COMPANY_AUTH_VERIFICATION_FEATURE_ENABLED", "0")) === 1;

    container.bind(CompanyAuthMiddleware)
        .toConstantValue(new CompanyAuthMiddleware(
            sessionStore,
            encryptionService,
            companyAuthConfig,
            sessionConfig,
            companyAuthFeatureEnabled));

    container.load(buildProviderModule());
    return container;
}

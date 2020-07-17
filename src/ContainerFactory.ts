import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';
import IORedis from 'ioredis';
import * as kafka from 'kafka-node';
import { CompaniesHouseSDK } from 'modules/Types';
import * as util from 'util';

import { APP_NAME } from 'app/Constants';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { CompanyAuthConfig } from 'app/models/CompanyAuthConfig';
import { PenaltyIdentifierSchemaFactory } from 'app/models/PenaltyIdentifierSchemaFactory';
import { SessionStoreConfig } from 'app/models/SessionConfig';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { Payload, Producer } from 'app/modules/email-publisher/producer/Producer';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { JwtEncryptionService } from 'app/modules/jwt-encryption-service/JwtEncryptionService';
import { RefreshTokenService } from 'app/modules/refresh-token-service/RefreshTokenService';
import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

function initiateKafkaClient(): kafka.KafkaClient {
    const connectionTimeoutInMillis: number = parseInt(
        getEnvOrDefault('KAFKA_BROKER_CONNECTION_TIMEOUT_IN_MILLIS', '2000'), 10
    );
    const requestTimeoutInMillis: number = parseInt(
        getEnvOrDefault('KAFKA_BROKER_REQUEST_TIMEOUT_IN_MILLIS', '4000'), 10
    );

    return new kafka.KafkaClient({
        kafkaHost: getEnvOrThrow('KAFKA_BROKER_ADDR'),
        connectTimeout: connectionTimeoutInMillis,
        connectRetryOptions: {
            retries: 5,
            factor: 2,
            minTimeout: connectionTimeoutInMillis,
            maxTimeout: 4 * connectionTimeoutInMillis,
            randomize: true
        },
        requestTimeout: requestTimeoutInMillis
    });
}

export function createContainer(): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: getEnvOrThrow('COOKIE_NAME'),
        cookieSecret: getEnvOrThrow('COOKIE_SECRET'),
    };
    const sessionStore = new SessionStore(new IORedis(`${getEnvOrThrow('CACHE_SERVER')}`));
    container.bind(SessionStore).toConstantValue(sessionStore);
    container.bind(SessionMiddleware).toConstantValue(SessionMiddleware(config, sessionStore));

    container.bind(EmailService).toConstantValue(new EmailService(APP_NAME,
        // tslint:disable-next-line: new-parens
        new class implements Producer {
            private readonly producer: kafka.Producer = new kafka.Producer(initiateKafkaClient());
            async send(payload: Payload): Promise<void> {
                await util.promisify(this.producer.send).call(this.producer, [{
                    topic: payload.topic,
                    messages: [payload.message]
                }]);
            }
        }));

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

    container.bind(CompaniesHouseSDK).toConstantValue(CompaniesHouseSDK(getEnvOrThrow('API_URL')));

    container.bind(PenaltyIdentifierSchemaFactory)
        .toConstantValue(new PenaltyIdentifierSchemaFactory(getEnvOrThrow('ALLOWED_COMPANY_PREFIXES')));

    const companyAuthConfig: CompanyAuthConfig = {
        accountUrl: getEnvOrThrow('ACCOUNT_URL'),
        accountRequestKey: getEnvOrThrow('OAUTH2_REQUEST_KEY'),
        accountClientId: getEnvOrThrow('OAUTH2_CLIENT_ID'),
        chsUrl: getEnvOrThrow('CHS_URL'),
    };

    const sessionConfig: SessionStoreConfig  = SessionStoreConfig.createFromEnvironmentVariables();
    const encryptionService = new JwtEncryptionService();
    const companyAuthFeatureEnabled = Number(getEnvOrThrow('COMPANY_AUTH_VERIFICATION_FEATURE_ENABLED')) === 1;

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

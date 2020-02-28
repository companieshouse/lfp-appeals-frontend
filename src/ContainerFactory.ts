import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';
import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { getEnvOrDefault } from './utils/EnvironmentUtils';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import * as IORedis from 'ioredis'
import * as kafka from 'kafka-node'
import { EmailService } from './modules/email-publisher/EmailService'

export function createContainer(): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: getEnvOrDefault('COOKIE_NAME'),
        cookieSecret: getEnvOrDefault('COOKIE_SECRET'),
    };
    const sessionStore = new SessionStore(new IORedis({
        host: getEnvOrDefault('CACHE_SERVER'),
        password: getEnvOrDefault('CACHE_PASSWORD', ''),
        db: Number(getEnvOrDefault('CACHE_DB'))
    }));
    container.bind(SessionStore).toConstantValue(sessionStore);
    container.bind(SessionMiddleware).toConstantValue(SessionMiddleware(config, sessionStore));
    container.bind(AuthMiddleware).toConstantValue(new AuthMiddleware());

    const kafkaClient = new kafka.KafkaClient({
        kafkaHost: getEnvOrDefault('KAFKA_BROKER_ADDR'),
        requestTimeout: 4000 // 4 seconds
    })
    container.bind(EmailService).toConstantValue(new EmailService('lfp-appeals-frontend', kafkaClient))

    container.load(buildProviderModule());
    return container;
}

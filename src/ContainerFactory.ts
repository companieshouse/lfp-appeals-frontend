import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';
import * as IORedis from 'ioredis'
import * as kafka from 'kafka-node'
import * as util from 'util'

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { Payload, Producer } from 'app/modules/email-publisher/producer/Producer'
import { AppealSubmitService } from 'app/service/AppealSubmitService';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

function initiateKafkaClient (): kafka.KafkaClient {
    const connectionTimeoutInMillis: number = parseInt(
        getEnvOrDefault('KAFKA_BROKER_CONNECTION_TIMEOUT_IN_MILLIS', '2000'), 10
    );
    const requestTimeoutInMillis: number = parseInt(
        getEnvOrDefault('KAFKA_BROKER_REQUEST_TIMEOUT_IN_MILLIS', '4000'), 10
    );

    return new kafka.KafkaClient({
        kafkaHost: getEnvOrDefault('KAFKA_BROKER_ADDR'),
        connectTimeout: connectionTimeoutInMillis,
        connectRetryOptions: {
            retries: 5,
            factor: 2,
            minTimeout: connectionTimeoutInMillis,
            maxTimeout: 4 * connectionTimeoutInMillis,
            randomize: true
        },
        requestTimeout: requestTimeoutInMillis
    })
}

export function createContainer(): Container {
    const container = new Container();
    const config: CookieConfig = {
        cookieName: getEnvOrDefault('COOKIE_NAME'),
        cookieSecret: getEnvOrDefault('COOKIE_SECRET'),
    };
    const sessionStore = new SessionStore(new IORedis(`${getEnvOrDefault('CACHE_SERVER')}`));
    container.bind(SessionStore).toConstantValue(sessionStore);
    container.bind(SessionMiddleware).toConstantValue(SessionMiddleware(config, sessionStore));
    container.bind(AuthMiddleware).toConstantValue(new AuthMiddleware());

    container.bind(AppealSubmitService).toConstantValue(new AppealSubmitService(getEnvOrDefault('APPEALS_API_URL')));

    container.bind(EmailService).toConstantValue(new EmailService('lfp-appeals-frontend',
        // tslint:disable-next-line: new-parens
        new class implements Producer {
            private readonly producer: kafka.Producer = new kafka.Producer(initiateKafkaClient());
            async send (payload: Payload): Promise<void> {
                await util.promisify(this.producer.send).call(this.producer, [{
                    topic: payload.topic,
                    messages: [payload.message]
                }]);
            }
        }))

    container.load(buildProviderModule());
    return container;
}

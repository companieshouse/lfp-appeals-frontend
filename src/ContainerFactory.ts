import { Container } from 'inversify';
import { RedisClient, createClient } from 'redis';
import { buildProviderModule } from 'inversify-binding-decorators';

const createRedisClient = () => {

    if (!process.env.CACHE_SERVER) {
        throw Error('CACHE_SERVER variable not set.');
    }
    const redisUrl = `redis://${process.env.CACHE_SERVER}`;

    return createClient(redisUrl).on('error', (err) => {
        throw err;
    });
};

const disconnectClient = (redisClient: RedisClient) => redisClient.flushall();

export function createContainer(): Container {
    const container = new Container();
    container.bind<RedisClient>(RedisClient).toConstantValue(createRedisClient());
    container.load(buildProviderModule());
    return container;
}

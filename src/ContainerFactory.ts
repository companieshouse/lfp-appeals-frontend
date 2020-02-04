import { Container } from 'inversify';
import { RedisClient, createClient } from 'redis';
import { buildProviderModule } from 'inversify-binding-decorators';

const createRedisClient = () => {
    return createClient(
        {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_HOST)
        }
    ).on('error', (err) => { throw err; });
};

const disconnectClient = (redisClient: RedisClient) => redisClient.flushall();

export function createContainer(): Container {
    const container = new Container();
    container.bind<RedisClient>(RedisClient).toConstantValue(createRedisClient());
    container.load(buildProviderModule());
    return container;
}

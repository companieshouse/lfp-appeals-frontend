import { Container } from 'inversify';
import { createRedisClient } from './services/RedisService';
import { RedisClient } from 'redis';
import { buildProviderModule } from 'inversify-binding-decorators';

export const TYPES = {
    RedisService: Symbol.for('RedisService'),
    RedisClient: Symbol.for('RedisClient'),
    ErrorHandler: Symbol.for('ErrorHandler')
};

export function assembleContainers(): Container {
    const container = new Container();
    container.bind<RedisClient>(TYPES.RedisClient).toConstantValue(createRedisClient());
    container.load(buildProviderModule())
    return container;
}
import { createClient, RedisClient } from 'redis';
import { injectable } from 'inversify';
import { promisify } from 'util';

export const getAsync = (client: RedisClient) => promisify(client.get).bind(client);
export const setAsync = (client: RedisClient) => promisify(client.set).bind(client);

@injectable()
export class RedisService {

    public readonly client: RedisClient;
    constructor() {
        this.client = this.createClient();
    }

    private createClient(): RedisClient {
        return createClient({
            host: '127.0.0.1',
            port: 6379,
        });
    }

    public disconnectClient = (redisClient: RedisClient) => redisClient.flushall();
}

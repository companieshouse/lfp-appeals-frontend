import { createClient, RedisClient } from 'redis';
import { injectable } from 'inversify';
import { promisify } from 'util';

export const getAsync = (client: RedisClient) => promisify(client.get).bind(client);
export const setAsync = (client: RedisClient) => promisify(client.set).bind(client);

@injectable()
export class RedisService {

    public readonly client: RedisClient;
    constructor() {
        this.client = this.createClient();    }

    public getClient(): RedisClient {
        return this.client;
    }

    private createClient(): RedisClient {
        return createClient({
            host: process.env.REDIS_URL,
            port: Number(process.env.REDIS_PORT),
        });
    }

    public disconnectClient = (redisClient: RedisClient) => redisClient.flushall();
}

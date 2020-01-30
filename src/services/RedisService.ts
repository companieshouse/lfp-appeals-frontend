import { createClient, RedisClient } from 'redis';
import { injectable } from 'inversify';

@injectable()
export class RedisService {
    public createNewSession(): RedisClient {
        return createClient({
            host: '127.0.0.1',
            port: 6379,
        });
    }

    public disconnectSession = (redisClient: RedisClient) => redisClient.flushall();
}

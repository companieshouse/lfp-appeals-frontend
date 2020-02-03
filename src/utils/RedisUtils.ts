import { createClient, RedisClient } from 'redis';
import { promisify } from 'util';
import { IMap } from './Types';

export const getAsync = (client: RedisClient) => promisify(client.get).bind(client);
export const setAsync = (client: RedisClient) => promisify(client.set).bind(client);
export const getObjectAsync = (client: RedisClient) => promisify(client.hgetall).bind(client);
export const setObjectAsync = (client: RedisClient) => async <T>(key: string, values: IMap<T>) =>
    new Promise((resolve, reject) => {
        client.hmset(key, values as any, (err, reply) => {
            if (err) return reject(err);
            return resolve(reply);
        });
    });
export const createRedisClient = () => createClient({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});
export const disconnectClient = (redisClient: RedisClient) => redisClient.flushall();

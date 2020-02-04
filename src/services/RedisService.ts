import { inject, Container } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { TYPES } from '../InjectableTypes';
import { IMap } from '../utils/Types';
import { promisify } from 'util';
import { createClient, RedisClient } from 'redis';
import { HealthCheckModel } from '../models/HealthCheckModel';

@provide(TYPES.RedisService)
export class RedisService {

    private healthObject: HealthCheckModel = {
        timesVisited: 0,
        lastTimeVisited: new Date().toISOString()
    };

    constructor(@inject(TYPES.RedisClient) private readonly redisClient: RedisClient) {
        this.redisClient.on('connect', () => this.checkHealth);
    }

    public async checkHealth(): Promise<any> {
        return this.getObject<HealthCheckModel>('healthCheck').then(obj => {
            if (obj) {
                this.healthObject = obj;
                this.healthObject.timesVisited = Number(this.healthObject.timesVisited) + 1;
                this.healthObject.lastTimeVisited = new Date().toISOString();
                this.setObject('healthCheck', this.healthObject);
            } else {
                this.setObject('healthCheck', this.healthObject);
            }
            return this.healthObject;
        });
    }

    public async get(key: string): Promise<string> {
        return getAsync(this.redisClient)(key);
    }

    public async set(key: string, value: string): Promise<any> {
        return setAsync(this.redisClient)(key, value);
    }

    public async setObject<T>(key: string, values: T): Promise<any> {
        return setObjectAsync(this.redisClient)(key, values);
    }

    public async getObject<T>(key: string): Promise<T> {
        return getObjectAsync(this.redisClient)(key);
    }

    public ping(): boolean {
        return this.redisClient.connected;
    }
}

/**
 * This type represents a computation that takes a variabe number of arguments
 * and returns a promise of completion.
 */
type DeferredComputation<T> = ((...args: any) => Promise<T>);

/**
 * This function represents a computation which will take a boolean condition and
 * a branch. This is used to test a precondition before executing an async computation.
 * @param cond The condiditon function
 * @param onFail The Function to execute on failure
 * @param onSuccess The DeferredComputation to pass by on success
 */
const actOnConnectionStatus =
    (cond: () => boolean) =>
        (onFail: () => void) =>
            (onSuccess: DeferredComputation<any>) => {
                if (cond()) {
                    return onSuccess;
                }
                return () => Promise.resolve(onFail());
            };

/**
 * Function used as the fail function in this context.
 */
const logError = () => console.error('Redis Not online');
/**
 * Partially applied function which uses the above function as the fail function.
 * @param cond The condiditon function
 */
const standardAction = (cond: () => boolean) => actOnConnectionStatus(cond)(logError);

/**
 * Implementation of redis getting a value async.
 */
const getAsync = (client: RedisClient) =>
    standardAction(() => client.connected)(promisify(client.get).bind(client));


/**
 * Implementation of redis setting a value async.
 */
const setAsync = (client: RedisClient) =>
    standardAction(() => client.connected)(promisify(client.set).bind(client));

/**
 * Implementation of redis getting an object async.
 */
const getObjectAsync = (client: RedisClient) =>
    standardAction(() => client.connected)(promisify(client.hgetall).bind(client));

/**
 * Implementation of redis setting an object async.
 */
const setObjectAsync = (client: RedisClient) => standardAction(() => client.connected)
    (async <T>(key: string, values: IMap<T>) =>
        new Promise((resolve, reject) => {
            client.hmset(key, values as any, (err: any, reply: any) => {
                if (err) return reject(err);
                return resolve(reply);
            });
        }));


/**
 * Creates a redis client instance and uses fail function to log errors. Rather than
 * crash the app.
 */
export const createRedisClient = () => {
    return createClient(
        {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_HOST)
        }
    ).on('error', (err) => { throw err; });
};
/**
 * Disconnects the redis client.
 */
export const disconnectClient = (redisClient: RedisClient) => redisClient.flushall();


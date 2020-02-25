import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { promisify } from 'util';
import { RedisClient } from 'redis';

@provide(RedisService)
export class RedisService {

    constructor(@inject(RedisClient) private readonly redisClient: RedisClient) {}

    public async get(key: string): Promise<string> {
        return getAsync(this.redisClient)(key);
    }

    public async set(key: string, value: string): Promise<any> {
        return setAsync(this.redisClient)(key, value);
    }

    public async getObject<T>(key: string): Promise<T> {
        return getObjectAsync(this.redisClient)(key);
    }

    public async setObject<T>(key: string, values: T): Promise<any> {
        return setObjectAsync(this.redisClient)(key, values);
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
    (async <T>(key: string, values: T) =>
        new Promise((resolve, reject) => {
            client.hmset(key, values as any, (err: any, reply: any) => {
                if (err) return reject(err);
                return resolve(reply);
            });
        }));


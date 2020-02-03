import { RedisClient } from 'redis';
import { injectable, inject } from 'inversify';
import { TYPES } from '../Types';
import { IMap } from '../utils/Types';
import { getAsync, setAsync, setObjectAsync, getObjectAsync } from '../utils/RedisUtils';

@injectable()
export class RedisService {

    constructor(@inject(TYPES.RedisClient) private readonly redisClient: RedisClient) { }

    public async get(key: string): Promise<string | undefined | null> {
        return getAsync(this.redisClient)(key);
    }

    public async set(key: string, value: string): Promise<any> {
        return setAsync(this.redisClient)(key, value);
    }

    public async setObject<T>(key: string, values: IMap<T>): Promise<any> {
        return setObjectAsync(this.redisClient)(key, values);
    }

    public async getObject(key: string): Promise<IMap<string> | undefined | null> {
        return getObjectAsync(this.redisClient)(key);
    }
}

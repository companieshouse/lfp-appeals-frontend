"use strict";
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const inversify_binding_decorators_1 = require("inversify-binding-decorators");
const util_1 = require("util");
const redis_1 = require("redis");
let RedisService = RedisService_1 = class RedisService {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    get(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return getAsync(this.redisClient)(key);
        });
    }
    set(key, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return setAsync(this.redisClient)(key, value);
        });
    }
    getObject(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return getObjectAsync(this.redisClient)(key);
        });
    }
    setObject(key, values) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return setObjectAsync(this.redisClient)(key, values);
        });
    }
    ping() {
        return this.redisClient.connected;
    }
};
RedisService = RedisService_1 = tslib_1.__decorate([
    inversify_binding_decorators_1.provide(RedisService_1),
    tslib_1.__param(0, inversify_1.inject(redis_1.RedisClient)),
    tslib_1.__metadata("design:paramtypes", [redis_1.RedisClient])
], RedisService);
exports.RedisService = RedisService;
const actOnConnectionStatus = (cond) => (onFail) => (onSuccess) => {
    if (cond()) {
        return onSuccess;
    }
    return () => Promise.resolve(onFail());
};
const logError = () => console.error('Redis Not online');
const standardAction = (cond) => actOnConnectionStatus(cond)(logError);
const getAsync = (client) => standardAction(() => client.connected)(util_1.promisify(client.get).bind(client));
const setAsync = (client) => standardAction(() => client.connected)(util_1.promisify(client.set).bind(client));
const getObjectAsync = (client) => standardAction(() => client.connected)(util_1.promisify(client.hgetall).bind(client));
const setObjectAsync = (client) => standardAction(() => client.connected)((key, values) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        client.hmset(key, values, (err, reply) => {
            if (err)
                return reject(err);
            return resolve(reply);
        });
    });
}));

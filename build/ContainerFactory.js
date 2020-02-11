"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const inversify_binding_decorators_1 = require("inversify-binding-decorators");
const ch_node_session_1 = require("ch-node-session");
const IORedis = require("ioredis");
const ConfigLoader_1 = require("./utils/ConfigLoader");
const disconnectClient = (redisClient) => redisClient.flushall();
function createContainer() {
    const container = new inversify_1.Container();
    const config = {
        cookieName: ConfigLoader_1.returnEnvVarible('COOKIE_NAME'),
        cookieSecret: ConfigLoader_1.returnEnvVarible('COOKIE_SECRET'),
    };
    const sessionStore = new ch_node_session_1.SessionStore(new IORedis(`redis://${ConfigLoader_1.returnEnvVarible('CACHE_SERVER')}:6379/${ConfigLoader_1.returnEnvVarible('CACHE_DB')}`));
    const sessionHandler = ch_node_session_1.SessionMiddleware(config, sessionStore);
    container.bind(ch_node_session_1.SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(ch_node_session_1.SessionStore).toConstantValue(sessionStore);
    container.load(inversify_binding_decorators_1.buildProviderModule());
    return container;
}
exports.createContainer = createContainer;

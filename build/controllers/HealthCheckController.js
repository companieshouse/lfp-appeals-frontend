"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const inversify_express_utils_1 = require("inversify-express-utils");
const http_status_codes_1 = require("http-status-codes");
const Paths_1 = require("../utils/Paths");
const ch_node_session_1 = require("ch-node-session");
let HealthCheckController = class HealthCheckController extends inversify_express_utils_1.BaseHttpController {
    constructor(store) {
        super();
        this.store = store;
    }
    healthCheckRedis() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const status = yield this.store.redis.ping().then(_ => http_status_codes_1.OK).catch(err => http_status_codes_1.INTERNAL_SERVER_ERROR);
            this.httpContext.response.status(status).send(`Redis status: ${status}`);
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], HealthCheckController.prototype, "healthCheckRedis", null);
HealthCheckController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.HEALTH_CHECK_URI),
    tslib_1.__param(0, inversify_1.inject(ch_node_session_1.SessionStore)),
    tslib_1.__metadata("design:paramtypes", [ch_node_session_1.SessionStore])
], HealthCheckController);
exports.HealthCheckController = HealthCheckController;

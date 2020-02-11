"use strict";
var SessionMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
const inversify_binding_decorators_1 = require("inversify-binding-decorators");
const inversify_1 = require("inversify");
let SessionMiddleware = SessionMiddleware_1 = class SessionMiddleware extends inversify_express_utils_1.BaseMiddleware {
    constructor(sessionHandler) {
        super();
        this.sessionHandler = sessionHandler;
    }
    handler(req, res, next) {
        return this.sessionHandler(req, res, next);
    }
};
SessionMiddleware = SessionMiddleware_1 = tslib_1.__decorate([
    inversify_binding_decorators_1.provide(SessionMiddleware_1),
    tslib_1.__param(0, inversify_1.inject('SessionHandler')),
    tslib_1.__metadata("design:paramtypes", [Function])
], SessionMiddleware);
exports.SessionMiddleware = SessionMiddleware;

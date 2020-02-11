"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
const Paths_1 = require("../utils/Paths");
const inversify_1 = require("inversify");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const BaseAsyncHttpController_1 = require("./BaseAsyncHttpController");
let LandingController = class LandingController extends BaseAsyncHttpController_1.BaseAsyncHttpController {
    constructor(auth) {
        super();
        this.auth = auth;
    }
    renderView(req, res, next) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.render('landing', { penaltyDetailsPage: Paths_1.PENALTY_DETAILS_PAGE_URI });
        });
    }
    continue(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.redirect(Paths_1.ENTRY_PAGE_URI).executeAsync();
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object, Function]),
    tslib_1.__metadata("design:returntype", Promise)
], LandingController.prototype, "renderView", null);
tslib_1.__decorate([
    inversify_express_utils_1.httpPost(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], LandingController.prototype, "continue", null);
LandingController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.ROOT_URI),
    tslib_1.__param(0, inversify_1.inject(AuthMiddleware_1.AuthMiddleware)),
    tslib_1.__metadata("design:paramtypes", [AuthMiddleware_1.AuthMiddleware])
], LandingController);
exports.LandingController = LandingController;

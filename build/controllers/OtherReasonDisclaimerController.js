"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
const Paths_1 = require("../utils/Paths");
const ch_node_session_1 = require("ch-node-session");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const BaseAsyncHttpController_1 = require("./BaseAsyncHttpController");
let OtherReasonDisclaimerController = class OtherReasonDisclaimerController extends BaseAsyncHttpController_1.BaseAsyncHttpController {
    constructor() {
        super();
    }
    showDisclaimer() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.render('other-reason-disclaimer');
        });
    }
    continue() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.redirect(Paths_1.OTHER_REASON_PAGE_URI).executeAsync();
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], OtherReasonDisclaimerController.prototype, "showDisclaimer", null);
tslib_1.__decorate([
    inversify_express_utils_1.httpPost(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], OtherReasonDisclaimerController.prototype, "continue", null);
OtherReasonDisclaimerController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.OTHER_REASON_DISCLAIMER_PAGE_URI, ch_node_session_1.SessionMiddleware, AuthMiddleware_1.AuthMiddleware),
    tslib_1.__metadata("design:paramtypes", [])
], OtherReasonDisclaimerController);
exports.OtherReasonDisclaimerController = OtherReasonDisclaimerController;

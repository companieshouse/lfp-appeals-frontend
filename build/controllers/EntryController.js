"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
const Paths_1 = require("../utils/Paths");
let EntryController = class EntryController extends inversify_express_utils_1.BaseHttpController {
    redirectView() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.redirect(Paths_1.PENALTY_DETAILS_PAGE_URI).executeAsync();
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], EntryController.prototype, "redirectView", null);
EntryController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.ENTRY_PAGE_URI)
], EntryController);
exports.EntryController = EntryController;

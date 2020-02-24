"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
const inversify_1 = require("inversify");
const http_status_codes_1 = require("http-status-codes");
const Paths_1 = require("../utils/Paths");
const BaseAsyncHttpController_1 = require("./BaseAsyncHttpController");
const SchemaValidator_1 = require("../utils/validation/SchemaValidator");
const PenaltyReferenceDetails_schema_1 = require("../models/PenaltyReferenceDetails.schema");
const Cookie_1 = require("ch-node-session/lib/session/model/Cookie");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ch_node_session_1 = require("ch-node-session");
let PenaltyDetailsController = class PenaltyDetailsController extends BaseAsyncHttpController_1.BaseAsyncHttpController {
    constructor(sessionStore) {
        super();
        this.sessionStore = sessionStore;
        this.COMPANY_NUMBER = 'companyNumber';
        this.PENALTY_REFERENCE = 'penaltyReference';
        this.COOKIE_NAME = 'penalty-cookie';
        this.PENALTY_TEMPLATE = 'penalty-details';
    }
    getPenaltyDetailsView(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = {
                companyNumber: '',
                penaltyReference: ''
            };
            const sessionData = req.session
                .chain(session => session.getExtraData())
                .map(data => data[this.COOKIE_NAME]);
            if (sessionData.isJust()) {
                return yield this.render(this.PENALTY_TEMPLATE, Object.assign({}, sessionData.__value));
            }
            else {
                return yield this.render(this.PENALTY_TEMPLATE, Object.assign({}, body));
            }
        });
    }
    createPenaltyDetails(req, res, next) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = {
                companyNumber: this.httpContext.request.body.companyNumber,
                penaltyReference: this.httpContext.request.body.penaltyReference
            };
            const validationResult = new SchemaValidator_1.SchemaValidator(PenaltyReferenceDetails_schema_1.schema).validate(body);
            if (validationResult.errors.length > 0) {
                return yield this.renderWithStatus(http_status_codes_1.UNPROCESSABLE_ENTITY)(this.PENALTY_TEMPLATE, Object.assign(Object.assign({}, body), { validationResult }));
            }
            req.session.map((session) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                session.saveExtraData(this.COOKIE_NAME, body);
                yield this.sessionStore.store(Cookie_1.Cookie.asCookie(session), session.data).run();
            }));
            return yield this.redirect(Paths_1.OTHER_REASON_DISCLAIMER_PAGE_URI).executeAsync();
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], PenaltyDetailsController.prototype, "getPenaltyDetailsView", null);
tslib_1.__decorate([
    inversify_express_utils_1.httpPost(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object, Function]),
    tslib_1.__metadata("design:returntype", Promise)
], PenaltyDetailsController.prototype, "createPenaltyDetails", null);
PenaltyDetailsController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.PENALTY_DETAILS_PAGE_URI, ch_node_session_1.SessionMiddleware, AuthMiddleware_1.AuthMiddleware),
    tslib_1.__param(0, inversify_1.inject(ch_node_session_1.SessionStore)),
    tslib_1.__metadata("design:paramtypes", [ch_node_session_1.SessionStore])
], PenaltyDetailsController);
exports.PenaltyDetailsController = PenaltyDetailsController;

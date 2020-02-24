"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const inversify_express_utils_1 = require("inversify-express-utils");
const Paths_1 = require("../utils/Paths");
const SchemaValidator_1 = require("../utils/validation/SchemaValidator");
const OtherReason_schema_1 = require("../models/OtherReason.schema");
const http_status_codes_1 = require("http-status-codes");
const Cookie_1 = require("ch-node-session/lib/session/model/Cookie");
const ch_node_session_1 = require("ch-node-session");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const sessionKey = 'session::other-reason';
let OtherReasonController = class OtherReasonController extends inversify_express_utils_1.BaseHttpController {
    constructor(store) {
        super();
        this.store = store;
    }
    renderForm(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const data = req.session
                .chain(session => session.getExtraData())
                .map(extraData => extraData[sessionKey]);
            if (data.isJust()) {
                return yield this.render(http_status_codes_1.OK, data.__value);
            }
            else {
                return yield this.render(http_status_codes_1.OK, {});
            }
        });
    }
    handleFormSubmission(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = req.body;
            const validationResult = new SchemaValidator_1.SchemaValidator(OtherReason_schema_1.schema).validate(body);
            const valid = validationResult.errors.length === 0;
            if (valid) {
                req.session.map((session) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    session.saveExtraData(sessionKey, body);
                    ch_node_session_1.EitherUtils.wrapEitherFunction(Cookie_1.Cookie.validateCookieString(req.cookies.__SID));
                    yield this.store.store(Cookie_1.Cookie.asCookie(session), session.data).run();
                }));
            }
            return this.render(valid ? http_status_codes_1.OK : http_status_codes_1.UNPROCESSABLE_ENTITY, Object.assign(Object.assign({}, body), { validationResult }));
        });
    }
    render(status, data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.httpContext.response.status(status).render('other-reason', data, (err, compiled) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(compiled);
                });
            });
        });
    }
};
tslib_1.__decorate([
    inversify_express_utils_1.httpGet(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], OtherReasonController.prototype, "renderForm", null);
tslib_1.__decorate([
    inversify_express_utils_1.httpPost(''),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], OtherReasonController.prototype, "handleFormSubmission", null);
OtherReasonController = tslib_1.__decorate([
    inversify_express_utils_1.controller(Paths_1.OTHER_REASON_PAGE_URI, ch_node_session_1.SessionMiddleware, AuthMiddleware_1.AuthMiddleware),
    tslib_1.__param(0, inversify_1.inject(ch_node_session_1.SessionStore)),
    tslib_1.__metadata("design:paramtypes", [ch_node_session_1.SessionStore])
], OtherReasonController);
exports.OtherReasonController = OtherReasonController;

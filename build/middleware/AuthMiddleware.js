"use strict";
var AuthMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_binding_decorators_1 = require("inversify-binding-decorators");
const inversify_express_utils_1 = require("inversify-express-utils");
const ConfigLoader_1 = require("../utils/ConfigLoader");
const SessionKey_1 = require("ch-node-session/lib/session/keys/SessionKey");
const SignInInfoKeys_1 = require("ch-node-session/lib/session/keys/SignInInfoKeys");
const Paths_1 = require("../utils/Paths");
let AuthMiddleware = AuthMiddleware_1 = class AuthMiddleware extends inversify_express_utils_1.BaseMiddleware {
    constructor() {
        super(...arguments);
        this.handler = (req, res, next) => {
            if (req.cookies.__SID) {
                const signInInfo = req.session.chain(session => session.getValue(SessionKey_1.SessionKey.SignInInfo));
                signInInfo.map(info => {
                    if (info[SignInInfoKeys_1.SignInInfoKeys.SignedIn] !== 1) {
                        console.log('Requires Auth');
                        res.redirect(`${ConfigLoader_1.returnEnvVarible('REDIRECT_URL')}?returnTo=${Paths_1.ROOT_URI}`);
                    }
                });
            }
            else {
                console.log('Requires Auth');
                res.redirect(`${ConfigLoader_1.returnEnvVarible('REDIRECT_URL')}?returnTo=${Paths_1.ROOT_URI}`);
            }
            return next();
        };
    }
};
AuthMiddleware = AuthMiddleware_1 = tslib_1.__decorate([
    inversify_binding_decorators_1.provide(AuthMiddleware_1)
], AuthMiddleware);
exports.AuthMiddleware = AuthMiddleware;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_express_utils_1 = require("inversify-express-utils");
class BaseAsyncHttpController extends inversify_express_utils_1.BaseHttpController {
    constructor() {
        super(...arguments);
        this.renderWithStatus = (code) => (template, options = {}) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => this.httpContext.response.status(code).render(template, options, (err, compiled) => {
                if (err) {
                    console.log(err);
                    reject('500 when rendering the template');
                }
                resolve(compiled);
            }));
        });
        this.render = this.renderWithStatus(200);
    }
}
exports.BaseAsyncHttpController = BaseAsyncHttpController;

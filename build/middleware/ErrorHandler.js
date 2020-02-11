"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
function handler(err, req, res, nextFunction) {
    console.error(err.message);
    if (!err.statusCode) {
        err.statusCode = http_status_codes_1.INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).send({
        error: err.message
    });
}
exports.handler = handler;

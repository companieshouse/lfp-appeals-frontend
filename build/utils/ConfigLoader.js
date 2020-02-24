"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ErrorHandler_1 = require("../middleware/ErrorHandler");
const Paths_1 = require("./Paths");
const DEFAULT_ENV_FILE = `${__dirname}/../../.env`;
const checkFileExists = (config) => {
    if (config.error)
        throw config.error;
    else
        return config;
};
exports.loadEnvironmentVariablesFromFiles = () => {
    dotenv.config({ path: DEFAULT_ENV_FILE });
    if (process.env.NODE_ENV) {
        const envFilePath = `${__dirname}/../../.env.${process.env.NODE_ENV}`;
        checkFileExists(dotenv.config({ path: envFilePath }));
    }
};
exports.getExpressAppConfig = (directory) => (app) => {
    app.use(Paths_1.ROOT_URI, express.static(path.join(directory, '/public')));
    app.use(Paths_1.ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend')));
    app.use(Paths_1.ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend/govuk')));
    app.use(Paths_1.ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend/govuk/assets')));
    app.use(ErrorHandler_1.handler);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.set('view engine', 'njk');
    nunjucks.configure([
        'build/views',
        'node_modules/govuk-frontend',
        'node_modules/govuk-frontend/components',
    ], {
        autoescape: true,
        express: app,
    });
    app.locals.ROOT_URI = Paths_1.ROOT_URI;
};
function returnEnvVarible(name, defaultVal) {
    const variable = process.env[name];
    if (!variable) {
        if (defaultVal !== undefined) {
            return defaultVal;
        }
        throw Error(`Variable ${name} was not found on env files.`);
    }
    return variable;
}
exports.returnEnvVarible = returnEnvVarible;

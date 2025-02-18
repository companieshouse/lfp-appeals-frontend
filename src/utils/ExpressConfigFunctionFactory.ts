import { createLoggerMiddleware } from "@companieshouse/structured-logging-node";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import nunjucks from "nunjucks";
import path from "path";

import { APP_NAME } from "app/Constants";
import { dateFilter } from "app/modules/nunjucks/DateFilter";
import { getEnv, getEnvOrDefault, getEnvOrThrow } from "app/utils/EnvironmentUtils";
import * as Paths from "app/utils/Paths";

export const createExpressConfigFunction = (directory: string) => (app: express.Application): void => {
    app.use(Paths.ROOT_URI, express.static(path.join(directory, "/node_modules/govuk-frontend")));
    app.use(Paths.ROOT_URI, express.static(path.join(directory, "/node_modules/govuk-frontend/govuk")));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    const loggingMiddleware = createLoggerMiddleware(APP_NAME);
    app.use(loggingMiddleware);

    app.set("view engine", "njk");
    const nunjucksEnv = nunjucks.configure([
        "dist/views",
        "views",
        "node_modules/govuk-frontend",
        "node_modules/govuk-frontend/components",
        "node_modules/@companieshouse/"
    ], {
        autoescape: true,
        express: app
    });

    nunjucksEnv.addFilter("date", dateFilter);

    app.locals.paths = Paths;
    app.locals.ui = {
        createChangeLinkConfig: (uri: string, accessibleName: string) => {
            return {
                href: `${uri}?cm=1`,
                text: "Change",
                visuallyHiddenText: accessibleName,
                attributes: {
                    "data-event-id": `Change - ${accessibleName}`
                }
            };
        }
    };

    app.locals.cdn = {
        host: getEnvOrThrow("CDN_HOST")
    };

    const url = getEnv("PIWIK_URL");
    const site = getEnv("PIWIK_SITE_ID");
    if (url && site) {
        app.locals.piwik = { url, site };
    }

    const chsUrl = getEnv("CHS_URL");
    app.locals.chs = {
        url: chsUrl
    };

    app.locals.featureFlags = {
        companyAuthVerificationEnabled: Number(getEnvOrDefault("COMPANY_AUTH_VERIFICATION_FEATURE_ENABLED", "0")) === 1,
        illnessReasonEnabled: Number(getEnvOrDefault("ILLNESS_REASON_FEATURE_ENABLED", "0")) === 1
    };
};

import { NextFunction, Request, Response } from "express";
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from "http-status-codes";
import { loggerInstance } from "./Logger";
import { CsrfError } from "@companieshouse/web-security-node";
import { getEnvOrThrow } from "app/utils/EnvironmentUtils";

const enquiryEmail: string = getEnvOrThrow("ENQUIRY_EMAIL");
const csrfErrorTemplateName = "csrf-error";

// @ts-ignore
export function notFoundHandler (req: Request, res: Response, next: NextFunction): void {
    res.status(NOT_FOUND).render("error-not-found", { enquiryEmail });
}

// @ts-ignore
export function defaultHandler (err: any, req: Request, res: Response, next: NextFunction): void {
    loggerInstance().error(`${err.constructor.name} - ${err.message}`);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).render("error");
}

// @ts-ignore
export function csrfErrorHandler (err: CsrfError | Error, req: Request, res: Response, next: NextFunction): void {
    if (!(err instanceof CsrfError)) {
        return next(err);
    }

    return res.status(403).render(csrfErrorTemplateName, {
        csrfErrors: true
    });
}

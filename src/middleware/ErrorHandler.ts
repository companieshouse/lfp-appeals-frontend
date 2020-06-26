import { NextFunction, Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import { loggerInstance } from './Logger';

import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { ROOT_URI } from 'app/utils/Paths';

const enquiryEmail: string = getEnvOrThrow('ENQUIRY_EMAIL');
const rootPath: string = ROOT_URI;

// @ts-ignore
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(NOT_FOUND).render('error-not-found', { enquiryEmail, rootPath });
}


// @ts-ignore
export function defaultHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    loggerInstance().error(`${err.constructor.name} - ${err.message}`);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).render('error');
}

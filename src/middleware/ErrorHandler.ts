import { NextFunction, Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import { loggerInstance } from './Logger';

// @ts-ignore
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(NOT_FOUND).render('error', {});
}


// @ts-ignore
export function defaultHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    loggerInstance().error(`${err.constructor.name} - ${err.message}${err.extraData ? ` - ${err.extraData}` : ''}`);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).render('error', err.message ? { message: err.message} : {})
}

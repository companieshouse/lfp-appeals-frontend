import { NextFunction, Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { loggerInstance } from './Logger';

// @ts-ignore
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(404).render('error');
}


// @ts-ignore
export function defaultHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    loggerInstance().error(err.message);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).render('error')
}

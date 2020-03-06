import { NextFunction, Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

// @ts-ignore
function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(404).render('error');
    next()
}


// @ts-ignore
function defaultHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error('xxxx', err.message);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.render('error')
}

export default [notFoundHandler, defaultHandler]


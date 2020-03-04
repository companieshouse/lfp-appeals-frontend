import { Request, Response, NextFunction } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

// @ts-ignore
export function handler(err: any, req: Request, res: Response, nextFunction: NextFunction): void {
    console.error(err.message);
    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).send({
        error: err.message
    });

}

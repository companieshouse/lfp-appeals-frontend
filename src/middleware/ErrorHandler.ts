import { Request, Response, NextFunction } from 'express';
import { BAD_REQUEST } from 'http-status-codes';

export function handler(err: any, req: Request, res: Response, nextFunction: NextFunction): void {
    console.error(err.message);
    if (!err.statusCode) {
        err.statusCode = BAD_REQUEST;
    }
    res.status(err.statusCode).send({
        error: err.message
    });

}

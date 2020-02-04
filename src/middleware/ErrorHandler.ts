import { Request, Response, NextFunction } from 'express';

export function handler(err: any, req: Request, res: Response, nextFunction: NextFunction): void {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);

}

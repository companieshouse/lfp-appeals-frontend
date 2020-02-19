import { NextFunction, Response, Request } from "express";


export function mocker (req:Request, res:Response, next:NextFunction): void {
    const session: Record<string, any> = {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
        email: 'joe@bloggs.mail',
        reason: {
            otherReason: 'I have reasons',
            otherInformation: 'They are legit'
        }
    };
    res.app.locals.session = session;
    next();
}

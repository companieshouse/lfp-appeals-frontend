import {Request, Response, NextFunction} from "express";

export function sessionMocker(req: Request, res: Response, next: NextFunction): void {

    req.session = {
        getExtraData (key: string) {
            return {
                penaltyIdentifier: {
                    companyNumber: '00345567',
                    penaltyReference: 'A00000001'
                },
                reasons: {
                    other: {
                        title: 'I have reasons',
                        description: 'They are legit'
                    }
                }
            }
        }
    } as any;

    next();
};

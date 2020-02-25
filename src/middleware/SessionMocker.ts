import { NextFunction, Response, Request } from 'express';
import { PenaltyIdentifier } from '../models/PenaltyIdentifier';
import { OtherReason } from '../models/OtherReason';

export function sessionMocker(req: Request, res: Response, next: NextFunction): void {

    const penaltyIdentifier: PenaltyIdentifier = {
        companyNumber: '00345567',
        penaltyReference: 'A00000001'
    };

    const otherReason: OtherReason = {
        title: 'I have reasons',
        description: 'They are legit'
    };

    req.session = {
        getValue(key: string): Record<string, any> {
            return {
                user_profile: {
                    email: 'joe@bloggs.mail'
                }
            }
        },
        getExtraData(key: string): Record<string, any> {
            return {
                penaltyIdentifier,
                reasons: {
                    other: otherReason
                }
            }
        }
    } as any;

    next()
}
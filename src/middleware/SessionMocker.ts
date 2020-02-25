import { NextFunction, Response, Request } from 'express';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { OtherReason } from '../models/OtherReason';


export function mocker(req: Request, res: Response, next: NextFunction): void {

    const penaltyIdentifier: PenaltyReferenceDetails = {
        companyNumber: '00345567',
        penaltyReference: 'A00000001'
    };

    const otherReason: OtherReason = {
        title: 'I have reasons',
        description: 'They are legit'
    };

    req.session = {
        getValue(key: string) {
            return {
                user_profile: {
                    email: 'joe@bloggs.mail'
                }
            }
        },
        getExtraData(key: string) {
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
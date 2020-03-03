import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export const APPEALS_KEY = 'appeals';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}

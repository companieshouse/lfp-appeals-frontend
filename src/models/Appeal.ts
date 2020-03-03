import { PenaltyIdentifier } from './PenaltyIdentifier';
import { Reasons } from './Reasons';

export const APPEALS_KEY = 'appeals';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}

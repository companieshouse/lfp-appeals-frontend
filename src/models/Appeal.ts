import { PenaltyIdentifier } from './PenaltyIdentifier';
import { Reasons } from './Reasons';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}

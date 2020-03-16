import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}


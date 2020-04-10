import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export interface Appeal {
    id?: string;
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}


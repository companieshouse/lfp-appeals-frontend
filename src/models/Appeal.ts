import { CreatedBy } from './CreateBy';

import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export interface Appeal {
    id?: string;
    createdBy?: CreatedBy;
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}


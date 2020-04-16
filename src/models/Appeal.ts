import { CreatedBy } from './CreateBy';

import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export interface Appeal {
    id?: string;
    createBy?: CreatedBy;
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}


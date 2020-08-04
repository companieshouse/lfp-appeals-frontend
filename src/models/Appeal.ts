import { CreatedBy } from 'app/models/CreatedBy';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';
import { ReasonType } from 'app/models/fields/ReasonType';

export interface Appeal {
    id?: string;
    createdBy?: CreatedBy;
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
    currentReasonType?: ReasonType;
}


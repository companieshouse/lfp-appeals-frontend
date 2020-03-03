import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';
import { AppealKeys } from 'app/models/keys/AppealKeys';

export interface Appeal {
    [AppealKeys.PENALTY_IDENTIFIER]: PenaltyIdentifier;
    [AppealKeys.REASONS]: Reasons;
}

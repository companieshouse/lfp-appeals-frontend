import { PenaltyIdentifier } from './PenaltyIdentifier';
import { Reasons } from './Reasons';
import { AppealKeys } from './keys/AppealKeys';

export interface Appeal {
    [AppealKeys.PENALTY_IDENTIFIER]: PenaltyIdentifier;
    [AppealKeys.REASONS]: Reasons;
}

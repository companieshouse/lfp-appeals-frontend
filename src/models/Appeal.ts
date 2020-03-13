import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export const APPEALS_KEY = 'appeals';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}

export interface Navigation{
    permissions: string[];
}

export interface ApplicationData{
    appeal: Appeal;
    navigation: Navigation
}

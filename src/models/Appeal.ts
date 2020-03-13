import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export const APPEALS_KEY = 'appeals';

export interface Appeal {
    penaltyIdentifier: PenaltyIdentifier;
    reasons: Reasons;
}

export interface Navigation{
    visitedPages: string[];
}

export interface AppealExtraData{
    appeal: Appeal;
    navigation: Navigation
}

// A note to damian: The naming is temporary, I will think of something better

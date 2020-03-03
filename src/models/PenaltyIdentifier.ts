import { PenaltyIdentifierKeys } from 'app/models/keys/PenaltyIdentifierKeys';

export interface PenaltyIdentifier {
    [PenaltyIdentifierKeys.COMPANY_NUMBER]: string;
    [PenaltyIdentifierKeys.PENALTY_REFERENCE]: string;
}


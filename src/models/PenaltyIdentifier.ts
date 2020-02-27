import { PenaltyIdentifierKeys } from './keys/PenaltyIdentifierKeys';

export interface PenaltyIdentifier {
    [PenaltyIdentifierKeys.COMPANY_NUMBER]: string;
    [PenaltyIdentifierKeys.PENALTY_REFERENCE]: string;
}


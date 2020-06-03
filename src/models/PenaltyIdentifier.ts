import { Penalty } from './Penalty';

export interface PenaltyIdentifier {
    companyNumber: string;
    penaltyReference: string;
    companyName?: string;
    penalty?: Penalty;
}


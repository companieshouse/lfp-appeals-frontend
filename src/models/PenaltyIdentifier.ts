import { PenaltyList } from 'ch-sdk-node/dist/services/lfp';

export interface PenaltyIdentifier {
    companyNumber: string;
    penaltyReference: string;
    companyName?: string;
    penaltyList?: PenaltyList;
}


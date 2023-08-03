import { PenaltyList } from '@companieshouse/api-sdk-node/dist/services/lfp';

export interface PenaltyIdentifier {
    companyNumber: string;
    userInputPenaltyReference: string;
    penaltyReference: string;
    companyName?: string;
    penaltyList?: PenaltyList;
}


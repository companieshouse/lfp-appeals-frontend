import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';

export const sanitizePenalty = (penaltyReference: string): string => {

    penaltyReference = penaltyReference.toUpperCase();
    const prefix = penaltyReference.substring(0,6);
    const companyNumber = sanitizeCompany(penaltyReference.substring(6, penaltyReference.length));
    return prefix + companyNumber;

};

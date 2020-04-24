import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';

export const sanitizeLegacyPenalty = (penaltyReference: string): string => {

    penaltyReference = penaltyReference.toUpperCase();
    const prefix: string = penaltyReference.substring(0,6);
    const companyNumber: string = sanitizeCompany(penaltyReference.substring(6, penaltyReference.length));
    return prefix + companyNumber;

};

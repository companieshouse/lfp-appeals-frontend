import { PenaltyReferenceDetails } from 'src/models/PenaltyReferenceDetails';
import { PenaltyDetailsController } from 'src/controllers/PenaltyDetailsController';

const COMPANY_NUMBER_SIZE: number = 8

export const sanitize = (penaltyDetails: PenaltyReferenceDetails): PenaltyReferenceDetails => {

    const sanitizedCompanyNumber = padNumber(penaltyDetails.companyNumber.toUpperCase())

    return {
        companyNumber: sanitizedCompanyNumber,
        penaltyReference: penaltyDetails.penaltyReference
    };
}

const padNumber = (companyNumber: string): string => {

    if(/^([a-zA-Z]{2}?)/gm.test(companyNumber)){
        const padFrom = 2

        const leadingChars = companyNumber.substring(0,padFrom)

        const trailingChars = companyNumber
            .substring(padFrom, companyNumber.length)
            .padStart(COMPANY_NUMBER_SIZE - padFrom, '0');

        return leadingChars + trailingChars

    } else {
        return companyNumber.padStart(COMPANY_NUMBER_SIZE, '0');
    }
};
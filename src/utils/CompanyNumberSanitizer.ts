const COMPANY_NUMBER_SIZE: number = 8;

export const sanitizeCompany = (companyNumber: string): string => {
    if (!companyNumber) {
        throw new Error('Company number is required');
    }

    companyNumber = companyNumber.toUpperCase();
    companyNumber = stripWhitespaces(companyNumber);
    return padNumber(companyNumber);
};

const stripWhitespaces = (companyNumber: string): string => {
    return companyNumber.replace(/\s/g, '');
};

const padNumber = (companyNumber: string): string => {
    if(/^([a-zA-Z]{2}?)/gm.test(companyNumber)){

        const leadingChars = companyNumber.substring(0,2);

        const trailingChars = companyNumber
            .substring(2, companyNumber.length)
            .padStart(6, '0');

        return leadingChars + trailingChars;

    } else {
        return companyNumber.padStart(COMPANY_NUMBER_SIZE, '0');
    }
};

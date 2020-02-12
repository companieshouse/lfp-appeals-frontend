
export const padNumber = (companyNumber: string): string => {
    if (/^(SC|NI)/gm.test(companyNumber)) {
        const leadingLetters = companyNumber.substring(0, 2);
        let trailingChars = companyNumber.substring(2, companyNumber.length);
        trailingChars = trailingChars.padStart(6, '0');
        companyNumber = leadingLetters + trailingChars;
    }
    else if (companyNumber.length > 0) {
        companyNumber = companyNumber.padStart(8, '0');
    }
    return companyNumber;
};


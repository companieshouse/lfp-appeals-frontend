export const sanitize = (companyNumber: string): string => {
    if (companyNumber.length === 0) return companyNumber
    return padNumber(companyNumber.toUpperCase())
}

const padNumber = (companyNumber: string): string => {

    if(/^([a-zA-Z]{1,2}?)/gm.test(companyNumber)){

        const leadingChars = companyNumber.substring(0,2)

        const trailingChars = companyNumber
            .substring(2, companyNumber.length)
            .padStart(6, '0');

        return leadingChars + trailingChars

    } else {

        return companyNumber.padStart(8, '0');
    }
};
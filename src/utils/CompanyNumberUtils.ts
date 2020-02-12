const COMPANY_NUMBER_SIZE = 8

export const sanitize = (companyNumber: string): string => {
    if (companyNumber.length === 0) return companyNumber
    return padNumber(companyNumber.toUpperCase())
}

const padNumber = (companyNumber: string): string => {

    // If first two characters are letters, pad after that
    if(/^([a-zA-Z]{2}?)/gm.test(companyNumber)){
        const padFrom = 2
        return pad(companyNumber, padFrom)

    // if first chracter is leter, pad after that
    } else if(/^([a-zA-Z]{1}?)/gm.test(companyNumber)){
        const padFrom = 1
        return pad(companyNumber, padFrom)

    // otherwise pad everything
    } else {
        return companyNumber.padStart(COMPANY_NUMBER_SIZE, '0');
    }
};

const pad = (companyNumber: string, padFrom: number): string =>{
    const leadingChars = companyNumber.substring(0,padFrom)

        const trailingChars = companyNumber
            .substring(padFrom, companyNumber.length)
            .padStart(COMPANY_NUMBER_SIZE - padFrom, '0');

        return leadingChars + trailingChars
}
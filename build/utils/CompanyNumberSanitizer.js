"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const COMPANY_NUMBER_SIZE = 8;
exports.sanitize = (companyNumber) => {
    if (!companyNumber) {
        throw new Error('Company number is required');
    }
    companyNumber = companyNumber.toUpperCase();
    companyNumber = stripWhitespaces(companyNumber);
    return padNumber(companyNumber);
};
const stripWhitespaces = (companyNumber) => {
    return companyNumber.replace(/\s/g, '');
};
const padNumber = (companyNumber) => {
    if (/^([a-zA-Z]{2}?)/gm.test(companyNumber)) {
        const leadingChars = companyNumber.substring(0, 2);
        const trailingChars = companyNumber
            .substring(2, companyNumber.length)
            .padStart(6, '0');
        return leadingChars + trailingChars;
    }
    else {
        return companyNumber.padStart(COMPANY_NUMBER_SIZE, '0');
    }
};

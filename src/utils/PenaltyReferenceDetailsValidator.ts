import * as Joi from '@hapi/joi';

export const schema = Joi.object({
    companyNumber: Joi.string()
        .replace(' ', '')
        .insensitive()
        .uppercase()
        .min(1).max(8)
        .regex(/^(SC|NI)?[0-9]{6,8}/)
        .messages({
            'string.empty': 'You must enter a company number',
            'string.min': 'You must enter your full eight character company number',
            'string.max': 'You must enter your full eight character company number',
            'string.pattern.base': 'You must enter your full eight character company number'
        }),
    penaltyReference: Joi.string()
        .replace(' ', '')
        .min(9).max(9)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.min': 'You must enter your reference number exactly as shown on your penalty notice',
            'string.max': 'You must enter your reference number exactly as shown on your penalty notice'
        })
});
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

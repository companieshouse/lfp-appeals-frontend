import * as Joi from '@hapi/joi';

export const penaltyDetailsSchema = Joi.object({
    companyNumber: Joi.string()
        .replace(' ', '')
        .insensitive()
        .uppercase()
        .regex(/^(((SC|NI)[0-9]{1,6})|([0-9]{1,8}))$/)
        .messages({
            'string.empty': 'You must enter a company number',
            'string.pattern.base': 'You must enter your full eight character company number'
        }),
    penaltyReference: Joi.string()
        .replace(' ', '')
        .insensitive()
        .uppercase()
        .regex(/([A-Z]{1}[0-9]{8})/)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.pattern.base': 'You must enter your reference number exactly as shown on your penalty notice'
        })
});
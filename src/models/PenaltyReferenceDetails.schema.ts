import * as Joi from '@hapi/joi';

export const schema= Joi.object({
    companyNumber: Joi.string()
        .required()
        .regex(/^(((SC|NI)[0-9]{6})|([0-9]{8}))$/)
        .messages({
            'string.empty': 'You must enter a company number',
            'string.pattern.base': 'You must enter your full eight character company number'
        }),
    penaltyReference: Joi.string()
        .required()
        .regex(/([A-Z]{1}[0-9]{8})$/)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.pattern.base': 'You must enter your reference number exactly as shown on your penalty notice'
        })
});

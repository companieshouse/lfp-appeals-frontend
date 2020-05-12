import * as Joi from '@hapi/joi';

export const companyNumberSchema = Joi.string()
    .required()
    .regex(/^((SC|NI)[0-9]{1,6}|[0-9]{1,8})$/i)
    .messages({
        'string.empty': 'You must enter a company number',
        'string.pattern.base': 'You must enter your full eight character company number'
    });

export const schema = Joi.object({
    companyNumber: companyNumberSchema,
    penaltyReference: Joi.string()
        .required()
        .regex(/^[a-z0-9/]{8,14}$/i)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.pattern.base': 'You must enter your reference number exactly as shown on your penalty notice'
        })
});



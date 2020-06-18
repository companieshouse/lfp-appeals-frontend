import Joi from '@hapi/joi';

export const errorMessage: string = 'Select the penalty you want to appeal';

export const schema = Joi.object({
    selectPenalty: Joi.string()
    .required()
    .messages({
        'any.required': errorMessage,
        'any.only': errorMessage,
        'string.base': errorMessage,
        'string.empty': errorMessage
    })
    .options({
        abortEarly: true
    })
});


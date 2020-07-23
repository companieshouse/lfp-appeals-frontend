import Joi from '@hapi/joi';

export const errorMessage: string = 'You must select a reason';

export const schema = Joi.object({
    selectReason: Joi.string()
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
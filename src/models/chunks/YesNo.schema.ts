import Joi from '@hapi/joi';

export const createSchema = (errorMessage: string): Joi.StringSchema => {
    return Joi.string()
        .required()
        .valid('true', 'false')
        .messages({
            'any.required': errorMessage,
            'any.only': errorMessage,
            'string.base': errorMessage,
            'string.empty': errorMessage
        })
        .options({
            abortEarly: true
        })
};

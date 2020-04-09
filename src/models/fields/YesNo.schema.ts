import Joi from '@hapi/joi';

import { YesNo } from 'app/models/fields/YesNo';

export const createSchema = (errorMessage: string): Joi.StringSchema => {
    return Joi.string()
        .required()
        .valid(YesNo.yes, YesNo.no)
        .messages({
            'any.required': errorMessage,
            'any.only': errorMessage,
            'string.base': errorMessage,
            'string.empty': errorMessage
        })
        .options({
            abortEarly: true
        });
};

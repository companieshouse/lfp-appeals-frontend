import Joi from '@hapi/joi';

import { Reason } from 'app/models/fields/Reason';

export const errorMessage: string = 'You must select a reason';

export const schema = Joi.object({
    chooseReason: Joi.string()
    .required()
    .valid(Reason.illness, Reason.other)
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
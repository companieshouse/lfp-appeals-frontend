import Joi from '@hapi/joi';

import { enabledAppealReasons } from 'app/utils/FeatureChecker';

export const errorMessage: string = 'You must select a reason';

export const schema = Joi.object({
    chooseReason: Joi.string()
    .required()
    .valid(...enabledAppealReasons())
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
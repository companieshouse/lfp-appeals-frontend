import Joi from '@hapi/joi';

import { IllPerson } from 'app/models/fields/IllPerson';

export const emptySelectionErrorMessage = 'You must select a person';
export const emptyOtherPersonErrorMessage = 'You must tell us more information';

export const schema = Joi.object({
    illPerson: Joi.string()
        .required()
        .valid(...Object.values(IllPerson).filter(x => typeof x === 'string'))
        .messages({
            'any.required': emptySelectionErrorMessage,
            'any.only': emptySelectionErrorMessage,
            'string.base': emptySelectionErrorMessage,
            'string.empty': emptySelectionErrorMessage
        }),
    otherPerson: Joi.when('illPerson', {
            is: IllPerson.otherPerson,
            then: Joi.string().required().pattern(/\w+/).messages({
                'any.required': emptyOtherPersonErrorMessage,
                'string.base': emptyOtherPersonErrorMessage,
                'string.empty': emptyOtherPersonErrorMessage,
                'string.pattern.base': emptyOtherPersonErrorMessage
            })
        })
}).options({ abortEarly: true });

import * as Joi from '@hapi/joi';

const titleErrorMessage = 'You must give your reason a title';
const descriptionErrorMessage = 'You must give us more information';

export const schema = Joi.object({
    title: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': titleErrorMessage,
            'string.base': titleErrorMessage,
            'string.empty': titleErrorMessage
        }),
    description: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': descriptionErrorMessage,
            'string.base': descriptionErrorMessage,
            'string.empty': descriptionErrorMessage
        })
});

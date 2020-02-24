"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("@hapi/joi");
const titleErrorMessage = 'You must give your reason a title';
const descriptionErrorMessage = 'You must give us more information';
exports.schema = Joi.object({
    title: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
        'any.required': titleErrorMessage,
        'string.base': titleErrorMessage,
        'string.empty': titleErrorMessage,
        'string.pattern.base': titleErrorMessage
    }),
    description: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
        'any.required': descriptionErrorMessage,
        'string.base': descriptionErrorMessage,
        'string.empty': descriptionErrorMessage,
        'string.pattern.base': descriptionErrorMessage
    })
});

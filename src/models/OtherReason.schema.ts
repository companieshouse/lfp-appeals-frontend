import * as Joi from "@hapi/joi";

const nameErrorMessage = "Enter your name";
const relationshipToCompanyErrorMessage = "Enter your relationship to the company";
const titleErrorMessage = "You must give your reason a title";
const descriptionErrorMessage = "You must give us more information";

export const schema = Joi.object({
    _csrf: Joi.string().optional(),
    name: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
            "any.required": nameErrorMessage,
            "string.base": nameErrorMessage,
            "string.empty": nameErrorMessage,
            "string.pattern.base": nameErrorMessage
        }),
    relationshipToCompany: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
            "any.required": relationshipToCompanyErrorMessage,
            "string.base": relationshipToCompanyErrorMessage,
            "string.empty": relationshipToCompanyErrorMessage,
            "string.pattern.base": relationshipToCompanyErrorMessage
        }),
    title: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
            "any.required": titleErrorMessage,
            "string.base": titleErrorMessage,
            "string.empty": titleErrorMessage,
            "string.pattern.base": titleErrorMessage
        }),
    description: Joi.string()
        .required()
        .pattern(/\w+/)
        .messages({
            "any.required": descriptionErrorMessage,
            "string.base": descriptionErrorMessage,
            "string.empty": descriptionErrorMessage,
            "string.pattern.base": descriptionErrorMessage
        })
});

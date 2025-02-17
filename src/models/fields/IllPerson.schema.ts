import Joi from "@hapi/joi";

import { getIllPersonValues, IllPerson } from "app/models/fields/IllPerson";

export const emptySelectionErrorMessage = "You must select a person";
export const emptyOtherPersonErrorMessage = "You must tell us more information";

export const schema = Joi.object({
    _csrf: Joi.string().optional(),
    illPerson: Joi.string()
        .required()
        .valid(...getIllPersonValues())
        .messages({
            "any.required": emptySelectionErrorMessage,
            "any.only": emptySelectionErrorMessage
        }),
    otherPerson: Joi.when("illPerson", {
        is: IllPerson.someoneElse,
        then: Joi.string().required().pattern(/\w+/).messages({
            "any.required": emptyOtherPersonErrorMessage,
            "string.base": emptyOtherPersonErrorMessage,
            "string.empty": emptyOtherPersonErrorMessage,
            "string.pattern.base": emptyOtherPersonErrorMessage
        })
    })
}).options({ abortEarly: true });

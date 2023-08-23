import * as Joi from "@hapi/joi";

const invalidDayErrorMessage: string = "You must enter a day";
const invalidMonthErrorMessage: string = "You must enter a month";
const invalidYearErrorMessage: string = "You must enter a year";
const invalidDateErrorMessage: string = "Enter a real date";
const dateInFutureErrorMessage: string = "Date must be today or in the past";

const dayMonthRegex: RegExp = /^[0-9]{1,2}$/;
const yearRegex: RegExp = /^[0-9]{4}$/;

export const schema = Joi.object({
    day: Joi.string()
        .required()
        .pattern(dayMonthRegex)
        .messages({
            "any.required": invalidDayErrorMessage,
            "string.base": invalidDayErrorMessage,
            "string.empty": invalidDayErrorMessage,
            "string.pattern.base": invalidDayErrorMessage
        }),
    month: Joi.string()
        .required()
        .pattern(dayMonthRegex)
        .messages({
            "any.required": invalidMonthErrorMessage,
            "string.base": invalidMonthErrorMessage,
            "string.empty": invalidMonthErrorMessage,
            "string.pattern.base": invalidMonthErrorMessage
        }),
    year: Joi.string()
        .required()
        .pattern(yearRegex)
        .messages({
            "any.required": invalidYearErrorMessage,
            "string.base": invalidYearErrorMessage,
            "string.empty": invalidYearErrorMessage,
            "string.pattern.base": invalidYearErrorMessage
        }),
    date: Joi.date()
        .required()
        .iso()
        .max("now")
        .messages({
            "any.required": invalidDateErrorMessage,
            "date.base": invalidDateErrorMessage,
            "date.format": invalidDateErrorMessage,
            "date.max": dateInFutureErrorMessage
        }),
    // Optional field to post illness start date on illness end date page
    illnessStart: Joi.string()
        .optional()
});

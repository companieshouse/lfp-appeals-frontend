import * as Joi from '@hapi/joi';

const illnessStartDayErrorMessage: string = 'You must enter a day';
const illnessStartMonthErrorMessage: string = 'You must enter a month';
const illnessStartYearErrorMessage: string = 'You must enter a year';
const invalidDateErrorMessage: string = 'Enter a real date';
const invalidDateFutureErrorMessage: string = 'Start date must be today or in the past';

const dayMonthRegex: RegExp = /^[0-9]{1,2}$/;
const yearRegex: RegExp = /^[0-9]{4}$/;

export const schema = Joi.object({
    startDay: Joi.string()
        .required()
        .pattern(dayMonthRegex)
        .messages({
            'any.required': illnessStartDayErrorMessage,
            'string.base': illnessStartDayErrorMessage,
            'string.empty': illnessStartDayErrorMessage,
            'string.pattern.base': illnessStartDayErrorMessage
        }),
    startMonth: Joi.string()
        .required()
        .pattern(dayMonthRegex)
        .messages({
            'any.required': illnessStartMonthErrorMessage,
            'string.base': illnessStartMonthErrorMessage,
            'string.empty': illnessStartMonthErrorMessage,
            'string.pattern.base': illnessStartMonthErrorMessage
        }),
    startYear: Joi.string()
        .required()
        .pattern(yearRegex)
        .messages({
            'any.required': illnessStartYearErrorMessage,
            'string.base': illnessStartYearErrorMessage,
            'string.empty': illnessStartYearErrorMessage,
            'string.pattern.base': illnessStartYearErrorMessage
        }),
    startDate: Joi.date()
        .required()
        .iso()
        .max('now')
        .messages({
            'any.required': invalidDateErrorMessage,
            'date.base': invalidDateErrorMessage,
            'date.format': invalidDateErrorMessage,
            'date.max': invalidDateFutureErrorMessage
        })
});

import * as Joi from '@hapi/joi';

const illnessStartDayErrorMessage: string = 'You must enter a day';
const illnessStartMonthErrorMessage: string = 'You must enter a month';
const illnessStartYearErrorMessage: string = 'You must enter a year';
const invalidDate: string = 'Enter a real date';
const invalidDateFuture: string = 'Start date must be today or in the past';

const dayRegex: RegExp = /^(0[1-9]|[12]\d|3[01])$/i;
const monthRegex: RegExp = /^(0?[1-9]|1[012])$/i;

export const schema = Joi.object({
    startDay: Joi.string()
        .required()
        .pattern(dayRegex)
        .messages({
            'string.empty': illnessStartDayErrorMessage,
            'string.pattern.base': illnessStartDayErrorMessage
        }),
    startMonth: Joi.string()
        .required()
        .pattern(monthRegex)
        .messages({
            'string.empty': illnessStartMonthErrorMessage,
            'string.pattern.base': illnessStartMonthErrorMessage
        }),
    startYear: Joi.string()
        .required()
        .length(4)
        .messages({
            'string.empty': illnessStartYearErrorMessage,
            'string.length': illnessStartYearErrorMessage
        }),
    startDate: Joi.date()
        .required()
        .iso()
        .max('now')
        .messages({
            'any.required': invalidDate,
            'date.base': invalidDate,
            'date.format': invalidDate,
            'date.max': invalidDateFuture
        })
});

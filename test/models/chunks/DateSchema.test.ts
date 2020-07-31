import { schema } from 'app/models/fields/Date.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);

const dayField: string = 'day';
const monthField: string = 'month';
const yearField: string = 'year';
const dateField: string = 'date';

describe('Date schema', () => {

    it('should reject empty object', () => {
        const validationResult = validator.validate({});
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject undefined values', () => {
        const validationResult = validator.validate({
            day: undefined,
            month: undefined,
            year: undefined,
            date: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject null values', () => {
        const validationResult = validator.validate({
            day: null,
            month: null,
            year: null,
            date: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject empty values', () => {
        const validationResult = validator.validate({
            day: '',
            month: '',
            year: '',
            date: new Date('')
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject blank values', () => {
        const validationResult = validator.validate({
            day: ' ',
            month: ' ',
            year: ' ',
            date: new Date(' ')
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject invalid date patterns', () => {
        const validationResult = validator.validate({
            day: '001',
            month: 'abc',
            year: '*@&',
            date: '0'
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dayField, 'You must enter a day'),
            new ValidationError(monthField, 'You must enter a month'),
            new ValidationError(yearField, 'You must enter a year'),
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject invalid (non-existing) date', () => {
        const validationResult = validator.validate({
            day: '33',
            month: '01',
            year: '2020',
            date: new Date('2020-01-33')
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dateField, 'Enter a real date')
        ]);
    });

    it('should reject invalid (future) date', () => {
        const validationResult = validator.validate({
            day: '01',
            month: '01',
            year: '2030',
            date: new Date('2030-01-01')
        });
        assertValidationErrors(validationResult, [
            new ValidationError(dateField, 'Start date must be today or in the past')
        ]);
    });

    it('should accept valid date values', () => {
        const validationResult = validator.validate({
            day: '01',
            month: '01',
            year: '2020',
            date: new Date('2020-01-01')
        });
        assertValidationErrors(validationResult, []);
    });

    it('should accept single digit date values', () => {
        const validationResult = validator.validate({
            day: '1',
            month: '1',
            year: '2020',
            date: new Date('2020-01-01')
        });
        assertValidationErrors(validationResult, []);
    });
});

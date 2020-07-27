import { schema } from 'app/models/fields/IllnessStartDate.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);

describe('IllnessStartDate schema', () => {

    it('should reject empty object', () => {
        const validationResult = validator.validate({});
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject undefined values', () => {
        const validationResult = validator.validate({
            startDay: undefined,
            startMonth: undefined,
            startYear: undefined,
            startDate: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject null values', () => {
        const validationResult = validator.validate({
            startDay: null,
            startMonth: null,
            startYear: null,
            startDate: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject empty values', () => {
        const validationResult = validator.validate({
            startDay: '',
            startMonth: '',
            startYear: '',
            startDate: ''
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject blank values', () => {
        const validationResult = validator.validate({
            startDay: ' ',
            startMonth: ' ',
            startYear: ' ',
            startDate: ' '
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject invalid date patterns', () => {
        const validationResult = validator.validate({
            startDay: '001',
            startMonth: 'abc',
            startYear: '*@&',
            startDate: '0'
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDay', 'You must enter a day'),
            new ValidationError('startMonth', 'You must enter a month'),
            new ValidationError('startYear', 'You must enter a year'),
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });


    it('should reject invalid (non-existing) date', () => {
        const validationResult = validator.validate({
            startDay: '33',
            startMonth: '01',
            startYear: '2020',
            startDate: '2020-01-33'
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });


    it('should reject invalid (format) date', () => {
        const validationResult = validator.validate({
            startDay: '01',
            startMonth: '01',
            startYear: '2020',
            startDate: '2020-01-01'
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDate', 'Enter a real date')
        ]);
    });

    it('should reject invalid (future) date', () => {
        const validationResult = validator.validate({
            startDay: '01',
            startMonth: '01',
            startYear: '2030',
            startDate: new Date('2030-01-01')
        });
        assertValidationErrors(validationResult, [
            new ValidationError('startDate', 'Start date must be today or in the past')
        ]);
    });

    it('should accept valid date values', () => {
        const validationResult = validator.validate({
            startDay: '01',
            startMonth: '01',
            startYear: '2020',
            startDate: new Date('2020-01-01')
        });
        assertValidationErrors(validationResult, []);
    });
    it('should accept single digit date values', () => {
        const validationResult = validator.validate({
            startDay: '1',
            startMonth: '1',
            startYear: '20',
            startDate: new Date('2020-01-01')
        });
        assertValidationErrors(validationResult, []);
    });
});

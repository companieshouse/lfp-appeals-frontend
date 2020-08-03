import { schema } from 'app/models/OtherReason.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);

describe('OtherReason schema', () => {
    it('should reject empty object', () => {
        const validationResult = validator.validate({});
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject undefined values', () => {
        const validationResult = validator.validate({
            title: undefined,
            description: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject null values', () => {
        const validationResult = validator.validate({
            title: null,
            description: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject empty values', () => {
        const validationResult = validator.validate({
            title: '',
            description: ''
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject blank values', () => {
        const validationResult = validator.validate({
            title: ' ',
            description: ' '
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should allow non empty values', () => {
        const validationResult = validator.validate({
            title: 'Some reason',
            description: 'Some description'
        });
        assertValidationErrors(validationResult, []);
    });

    it('should allow non empty values with leading / trailing spaces', () => {
        const validationResult = validator.validate({
            title: ' Some reason ',
            description: ' Some description '
        });
        assertValidationErrors(validationResult, []);
    });
});


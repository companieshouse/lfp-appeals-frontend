import { schema } from 'app/models/OtherReason.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);

const nameErrorMessage = 'Enter your name';
const titleErrorMessage = 'You must give your reason a title';
const descriptionErrorMessage = 'You must give us more information';

describe('OtherReason schema', () => {
    it('should reject empty object', () => {
        const validationResult = validator.validate({});
        assertValidationErrors(validationResult, [
            new ValidationError('name', nameErrorMessage),
            new ValidationError('title', titleErrorMessage),
            new ValidationError('description', descriptionErrorMessage)
        ]);
    });

    it('should reject undefined values', () => {
        const validationResult = validator.validate({
            name: undefined,
            title: undefined,
            description: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError('name', nameErrorMessage),
            new ValidationError('title', titleErrorMessage),
            new ValidationError('description', descriptionErrorMessage)
        ]);
    });

    it('should reject null values', () => {
        const validationResult = validator.validate({
            name: null,
            title: null,
            description: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError('name', nameErrorMessage),
            new ValidationError('title', titleErrorMessage),
            new ValidationError('description', descriptionErrorMessage)
        ]);
    });

    it('should reject empty values', () => {
        const validationResult = validator.validate({
            name: '',
            title: '',
            description: ''
        });
        assertValidationErrors(validationResult, [
            new ValidationError('name', nameErrorMessage),
            new ValidationError('title', titleErrorMessage),
            new ValidationError('description', descriptionErrorMessage)
        ]);
    });

    it('should reject blank values', () => {
        const validationResult = validator.validate({
            name: ' ',
            title: ' ',
            description: ' '
        });
        assertValidationErrors(validationResult, [
            new ValidationError('name', nameErrorMessage),
            new ValidationError('title', titleErrorMessage),
            new ValidationError('description', descriptionErrorMessage)
        ]);
    });

    it('should allow non empty values', () => {
        const validationResult = validator.validate({
            name: 'Some name',
            title: 'Some reason',
            description: 'Some description'
        });
        assertValidationErrors(validationResult, []);
    });

    it('should allow non empty values with leading / trailing spaces', () => {
        const validationResult = validator.validate({
            name: ' Some name ',
            title: ' Some reason ',
            description: ' Some description '
        });
        assertValidationErrors(validationResult, []);
    });
});


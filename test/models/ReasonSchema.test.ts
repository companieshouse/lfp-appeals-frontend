import { schema } from 'app/models/fields/Reason.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);

describe('Reason schema', () => {
    describe('invalid values', () => {
        const assertValidationError = (validationResult: ValidationResult) => assertValidationErrors(validationResult, [
            new ValidationError('reason', 'You must select a reason')
        ]);

        it('should reject an undefined string', () => {
            const validationResult = validator.validate({
                reason: undefined
            });
            assertValidationError(validationResult);
        });

        it('should reject null string', () => {
            const validationResult = validator.validate({
                reason: null
            });
            assertValidationError(validationResult);
        });

        it('should reject empty string', () => {
            const validationResult = validator.validate({
                reason: ''
            });
            assertValidationError(validationResult);
        });

        it('should reject blank string', () => {
            const validationResult = validator.validate({
                reason: ' '
            });
            assertValidationError(validationResult);
        });

        it('should reject incorrect string', () => {
            const validationResult = validator.validate({
                reason: 'xyz'
            });
            assertValidationError(validationResult);
        });
    });

    describe('valid values', () => {
        it('should accept "illness" reason', () => {
            const validationResult = validator.validate({
                reason: 'illness'
            });
            assertValidationErrors(validationResult, []);
        });

        it('should accept "other" reason', () => {
            const validationResult = validator.validate({
                reason: 'other'
            });
            assertValidationErrors(validationResult, []);
        });
    });
});
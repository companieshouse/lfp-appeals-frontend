import Joi from '@hapi/joi';

import { YesNo } from 'app/models/chunks/YesNo';
import { createSchema } from 'app/models/chunks/YesNo.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(Joi.object({
    consent: createSchema('Invalid value')
}));

describe('YesNo schema', () => {
    describe('invalid values', () => {
        const assertValidationError = (validationResult: ValidationResult) => assertValidationErrors(validationResult, [
            new ValidationError('consent', 'Invalid value')
        ]);

        it('should reject undefined string', () => {
            const validationResult = validator.validate({
                consent: undefined
            });
            assertValidationError(validationResult);
        });

        it('should reject null string', () => {
            const validationResult = validator.validate({
                consent: null
            });
            assertValidationError(validationResult);
        });

        it('should reject empty string', () => {
            const validationResult = validator.validate({
                consent: ''
            });
            assertValidationError(validationResult);
        });

        it('should reject blank string', () => {
            const validationResult = validator.validate({
                consent: ' '
            });
            assertValidationError(validationResult);
        });

        it('should reject incorrect string', () => {
            const validationResult = validator.validate({
                consent: 'xyz'
            });
            assertValidationError(validationResult);
        })
    });

    describe('invalid values', () => {
        it('should accept "yes" string', () => {
            const validationResult = validator.validate({
                consent: YesNo.yes
            });
            assertValidationErrors(validationResult, [])
        });

        it('should accept "no" string', () => {
            const validationResult = validator.validate({
                consent: YesNo.no
            });
            assertValidationErrors(validationResult, [])
        });
    })
});



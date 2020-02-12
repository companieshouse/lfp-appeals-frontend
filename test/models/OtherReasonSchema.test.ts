import { expect } from 'chai';

import { schema } from '../../src/models/OtherReason.schema';
import { SchemaValidator } from '../../src/utils/validation/SchemaValidator';
import { ValidationResult } from '../../src/utils/validation/ValidationResult';
import { ValidationError } from '../../src/utils/validation/ValidationError';

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
            reason: undefined,
            description: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject null values', () => {
        const validationResult = validator.validate({
            reason: null,
            description: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should reject empty values', () => {
        const validationResult = validator.validate({
            reason: '',
            description: ''
        });
        assertValidationErrors(validationResult, [
            new ValidationError('title', 'You must give your reason a title'),
            new ValidationError('description', 'You must give us more information')
        ]);
    });

    it('should allow non empty values', () => {
        const validationResult = validator.validate({
            reason: 'Some reason',
            description: 'Some description'
        });
        assertValidationErrors(validationResult, []);
    });
});

const assertValidationErrors = (result: ValidationResult, expectedErrors: ValidationError[]): void => {
    expect(result.errors).to.have.length(expectedErrors.length);
    expectedErrors.forEach(expectedError => {
        expect(result.getErrorForField(expectedError.field)?.text).to.be.equal(expectedError.text);
    });
};

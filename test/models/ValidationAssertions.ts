import { expect } from 'chai';

import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export const assertValidationErrors = (result: ValidationResult, expectedErrors: ValidationError[]): void => {
    expect(result.errors).to.have.length(expectedErrors.length);
    expectedErrors.forEach(expectedError => {
        expect(result.getErrorForField(expectedError.field)?.text).to.be.equal(expectedError.text);
    });
};

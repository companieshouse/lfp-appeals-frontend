import { expect } from 'chai';

import { ValidationResult } from '../../../src/utils/validation/ValidationResult';
import { ValidationError } from '../../../src/utils/validation/ValidationError';

const error = new ValidationError('field', 'Unexpected error');

describe('ValidationResult', () => {
    describe('instance creation', () => {
        it('should instantiate with empty array of errors by default', () => {
            expect(new ValidationResult().errors).to.be.empty;
        });

        it('should allow instantiating with provided array of errors', () => {
            expect(new ValidationResult([error]).errors).to.be.deep.equal([error]);
        });
    });

    describe('retrieving error for specific field', () => {
        it('should return undefined when error for given field does not exist', () => {
            expect(new ValidationResult([]).getErrorForField('field')).to.be.undefined;
        });

        it('should return matching error when error for given field does exist', () => {
            expect(new ValidationResult([error]).getErrorForField('field')).to.be.deep.equal(error);
        });
    })
});

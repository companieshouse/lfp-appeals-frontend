import { expect } from 'chai';

import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const error = new ValidationError('field', 'Unexpected error');

describe('ValidationResult', () => {
    describe('instance creation', () => {
        it('should instantiate with empty array of errors by default', () => {
            // tslint:disable-next-line:no-unused-expression
            expect(new ValidationResult().errors).to.be.empty;
        });

        it('should allow instantiating with provided array of errors', () => {
            expect(new ValidationResult([error]).errors).to.be.deep.equal([error]);
        });
    });

    describe('retrieving error for specific field', () => {
        it('should return undefined when error for given field does not exist', () => {
            // tslint:disable-next-line:no-unused-expression
            expect(new ValidationResult([]).getErrorForField('field')).to.be.undefined;
        });

        it('should return matching error when error for given field does exist', () => {
            expect(new ValidationResult([error]).getErrorForField('field')).to.be.deep.equal(error);
        });
    });
});

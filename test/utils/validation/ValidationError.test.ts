import { expect } from 'chai';

import { ValidationError } from '../../../src/utils/validation/ValidationError';

describe('ValidationError', () => {
    describe('instance creation', () => {
        [undefined, null, ''].forEach(invalidValue => {
            it(`should throw Error when field name is '${invalidValue}'`, () => {
                expect(() => new ValidationError(invalidValue as any, 'Unexpected error')).throws('Field name is required');
            });
        });

        [undefined, null, ''].forEach(invalidValue => {
            it(`should throw Error when error message is '${invalidValue}'`, () => {
                expect(() => new ValidationError('field', invalidValue as any)).throws('Error message is required');
            });
        });
    });

    describe('link building', () => {
        it(`should prepend field name with '#' and append '-error' to field name`, () => {
            expect(new ValidationError('field', 'Unexpected error').href).to.be.equal('#field-error');
        });
    });
});

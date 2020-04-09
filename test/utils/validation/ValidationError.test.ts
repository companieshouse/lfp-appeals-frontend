import { expect } from 'chai';

import { ValidationError } from 'app/utils/validation/ValidationError';

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
        it('should prepend field name with "#" and append "-error" to field name', () => {
            expect(new ValidationError('field', 'Unexpected error').href).to.be.equal('#field-error');
        });

        it('should hyphenise field name when it is camel cased', () => {
            expect(new ValidationError('longerField', 'Unexpected error').href).to.be.equal('#longer-field-error');
            expect(new ValidationError('evenLongerField', 'Unexpected error').href).to.be.equal('#even-longer-field-error');
            expect(new ValidationError('TheLongestField', 'Unexpected error').href).to.be.equal('#the-longest-field-error');
        });

        it('should not hyphenise field name when it is already hyphenised', () => {
            expect(new ValidationError('longer-field', 'Unexpected error').href).to.be.equal('#longer-field-error');
        });
    });
});

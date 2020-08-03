import { IllPerson } from 'app/models/fields/IllPerson';
import { schema } from 'app/models/fields/IllPerson.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);
const emptySelectionErrorMessage = 'You must select a person';
const emptyOtherPersonErrorMessage = 'You must tell us more information';

describe('IllPerson schema', () => {

    describe('should reject', () => {

        it('empty object with only one error', () => {
            const validationResult = validator.validate({});
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('undefined values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: undefined,
                otherPerson: undefined
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('null values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: null,
                otherPerson: null
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('empty values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: '',
                otherPerson: ''
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('blank values', () => {
            const validationResult = validator.validate({
                illPerson: ' ',
                otherPerson: ' '
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('falsy values for Other Person when "Other" is selected', () => {
            const falsyValues = [null, '', ' ', undefined];
            falsyValues.forEach(val => {
                const validationResult = validator.validate({
                    illPerson: IllPerson.otherPerson,
                    otherPerson: val
                });

                assertValidationErrors(validationResult, [
                    new ValidationError('otherPerson', emptyOtherPersonErrorMessage)
                ]);
            });
        });
    });

    describe('should allow', () => {
        it('all valid non-"other" values for illPerson without otherPerson field', () => {
            const validValues = ['director', 'accountant', 'family', 'employee'];
            validValues.forEach(val => {
                const validationResult = validator.validate({
                    illPerson: val,
                });
                assertValidationErrors(validationResult, []);
            });
        });

        it('"Other" for illPerson with otherPerson field filled', () => {
            const validationResult = validator.validate({
                illPerson: IllPerson.otherPerson,
                otherPerson: 'Director’s Dog'
            });
            assertValidationErrors(validationResult, []);
        });
    });
});


import { IllPerson } from 'app/models/fields/IllPerson';
import { schema } from 'app/models/fields/IllPerson.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

import { assertValidationErrors } from 'test/models/ValidationAssertions';

const validator = new SchemaValidator(schema);
const emptySelectionErrorMessage = 'You must select a person';
const emptyOtherPersonErrorMessage = 'You must tell us more information';

describe('IllPerson schema', () => {

    describe('invalid', () => {

        it('should reject empty object with only one error', () => {
            const validationResult = validator.validate({});
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('should reject undefined values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: undefined,
                otherPerson: undefined
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('should reject null values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: null,
                otherPerson: null
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('should reject empty values with only one error', () => {
            const validationResult = validator.validate({
                illPerson: '',
                otherPerson: ''
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('should reject blank values', () => {
            const validationResult = validator.validate({
                illPerson: ' ',
                otherPerson: ' '
            });
            assertValidationErrors(validationResult, [
                new ValidationError('illPerson', emptySelectionErrorMessage)
            ]);
        });

        it('should reject falsy values for Other Person when "Someone Else" is selected', () => {
            const falsyValues = [null, '', ' ', undefined];
            falsyValues.forEach(val => {
                const validationResult = validator.validate({
                    illPerson: IllPerson.someoneElse,
                    otherPerson: val
                });

                assertValidationErrors(validationResult, [
                    new ValidationError('otherPerson', emptyOtherPersonErrorMessage)
                ]);
            });
        });
    });

    describe('valid', () => {
        it('should accept all valid non-"someone else" values for illPerson without otherPerson field', () => {
            const validValues = ['director', 'accountant', 'family', 'employee'];
            validValues.forEach(val => {
                const validationResult = validator.validate({
                    illPerson: val,
                });
                assertValidationErrors(validationResult, []);
            });
        });

        it('should accept "Other" for illPerson with otherPerson field filled', () => {
            const validationResult = validator.validate({
                illPerson: IllPerson.someoneElse,
                otherPerson: 'Director’s Dog'
            });
            assertValidationErrors(validationResult, []);
        });
    });
});


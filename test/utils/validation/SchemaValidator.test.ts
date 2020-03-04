import * as Joi from '@hapi/joi';
import { expect } from 'chai';

import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';

describe('SchemaValidator', () => {
    describe('instance creation', () => {
        [undefined, null].forEach(invalidValue => {
            it(`should throw Error when schema is '${invalidValue}'`, () => {
                expect(() => new SchemaValidator(invalidValue as any)).throws('Schema is required');
            });
        });
    });

    describe('validation', () => {
        const schema = Joi.object({
            city: Joi.string().required()
        });
        const validator = new SchemaValidator(schema);

        it('should return validation result without errors when validation succeeded', () => {
            const validationResult = validator.validate({ city: 'Cardiff' });
            // tslint:disable-next-line:no-unused-expression
            expect(validationResult.errors).to.be.empty;
        });

        it('should return validation result with errors when validation failed', () => {
            const validationResult = validator.validate({});
            expect(validationResult.errors).to.be.deep.equal([new ValidationError('city', '"city" is required')]);
        });
    });
});

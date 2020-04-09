import { AnySchema, ValidationOptions } from '@hapi/joi';

import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const validationOptions: ValidationOptions = {
    abortEarly: false,
    convert: false
};

export class SchemaValidator {
    constructor(private readonly schema: AnySchema) {
        if (!schema) {
            throw new Error('Schema is required');
        }
    }

    public validate(data: any): ValidationResult {
        const { error } = this.schema.validate(data, validationOptions);
        return new ValidationResult(error ? error.details.map(item => {
            return new ValidationError(item.path.join('.'), item.message);
        }) : []);
    }
}

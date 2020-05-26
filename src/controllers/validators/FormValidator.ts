import { AnySchema } from '@hapi/joi';
import { Request } from 'express';

import { Validator } from 'app/controllers/validators/Validator';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class FormValidator implements Validator {
    constructor(private readonly formSchema: AnySchema) {}

    async validate(request: Request): Promise<ValidationResult> {
        return new SchemaValidator(this.formSchema).validate(request.body);
    }
}

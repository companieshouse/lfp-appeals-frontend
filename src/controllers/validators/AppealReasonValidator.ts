import { Request } from 'express';
import { FormValidator } from './FormValidator';

import { schema } from 'app/models/fields/Reason.schema';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class AppealReasonValidator extends FormValidator {
    constructor() {
        super(schema);
    }

    public async validate(request: Request): Promise<ValidationResult> {
        const result: ValidationResult = await super.validate(request);
        return result;
    }
}
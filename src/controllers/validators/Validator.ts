import { Request } from 'express';

import { ValidationResult } from 'app/utils/validation/ValidationResult';

export interface Validator {
    validate(request: Request): ValidationResult;
}

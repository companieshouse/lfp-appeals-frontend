import { Request } from 'express';
import { FormValidator } from './FormValidator';

import { schema } from 'app/models/fields/Date.schema';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class StartDateValidator extends FormValidator {
    constructor() {
        super(schema);
    }

    public async validate(request: Request): Promise<ValidationResult> {

        const dayField: string = 'day';
        const monthField: string = 'month';
        const yearField: string = 'year';
        const startDateField: string = 'startDate';

        request.body.startDate = new Date(
            `${request.body[yearField]}-${request.body[monthField]}-${request.body[dayField]}`);

        const validationResult: ValidationResult = await super.validate(request);

        if (validationResult.errors.length > 0) {
            const startDateError: ValidationError | undefined = validationResult.getErrorForField(startDateField);

            if (startDateError &&
                (validationResult.getErrorForField(dayField) ||
                    validationResult.getErrorForField(monthField) ||
                    validationResult.getErrorForField(yearField))) {

                validationResult.errors.splice(validationResult.errors.indexOf(startDateError), 1);
            }
        }
        return validationResult;
    }
}

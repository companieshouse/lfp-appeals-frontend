import { Request } from 'express';
import { FormValidator } from './FormValidator';

import { schema } from 'app/models/fields/IllnessStartDate.schema';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class StartDateValidator extends FormValidator {
    constructor() {
        super(schema);
    }

    public async validate(request: Request): Promise<ValidationResult> {

        const startDay: string = 'startDay';
        const startMonth: string = 'startMonth';
        const startYear: string = 'startYear';
        const startDate: string = 'startDate';

        request.body.startDate = new Date(
            `${request.body[startYear]}-${request.body[startMonth]}-${request.body[startDay]}`);

        const validationResult: ValidationResult = await super.validate(request);

        if (validationResult.errors.length > 0) {
            const startDateError: ValidationError | undefined = validationResult.getErrorForField(startDate);

            if (startDateError &&
                (validationResult.getErrorForField(startDay) ||
                    validationResult.getErrorForField(startMonth) ||
                    validationResult.getErrorForField(startYear))) {

                validationResult.errors.splice(validationResult.errors.indexOf(startDateError), 1);
            }
        }
        return validationResult;
    }
}

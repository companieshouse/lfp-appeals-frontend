import { Request } from "express";
import moment from "moment";
import { FormValidator } from "./FormValidator";

import { schema } from "app/models/fields/Date.schema";
import { ValidationError } from "app/utils/validation/ValidationError";
import { ValidationResult } from "app/utils/validation/ValidationResult";

export class DateValidator extends FormValidator {
    constructor () {
        super(schema);
    }

    public async validate (request: Request): Promise<ValidationResult> {

        const dayField: string = "day";
        const monthField: string = "month";
        const yearField: string = "year";
        const dateField: string = "date";

        request.body.date = moment(`${request.body[yearField]}-${request.body[monthField]}-${request.body[dayField]}`)
            .toDate();

        const validationResult: ValidationResult = await super.validate(request);

        if (validationResult.errors.length > 0) {
            const dateError: ValidationError | undefined = validationResult.getErrorForField(dateField);

            if (dateError &&
                (validationResult.getErrorForField(dayField) ||
                    validationResult.getErrorForField(monthField) ||
                    validationResult.getErrorForField(yearField))) {

                validationResult.errors.splice(validationResult.errors.indexOf(dateError), 1);
            }
        }
        return validationResult;
    }
}

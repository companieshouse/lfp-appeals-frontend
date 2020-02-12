import { penaltyDetailsSchema } from './Schemas';
import Joi = require('@hapi/joi');
import { ValidationResult } from '../utils/validation/ValidationResult';
import { ValidationError } from '../utils/validation/ValidationError';


export class Validate{

    static validate(data: PenaltyReferenceDetails): ValidationResult {

        const results: Joi.ValidationResult = penaltyDetailsSchema.validate(
            {
                companyNumber: data.companyNumber,
                penaltyReference: data.penaltyReference
            },
            {
                abortEarly: false
            }
        )

        console.log(results.error?.details);

        const result: ValidationResult = new ValidationResult();

        results.error?.details.forEach((item: Joi.ValidationErrorItem) => {
            const path: string = item.path[0] as string;

            result.errors.push(new ValidationError(path, item.message));

        });

        return result;
    }
}


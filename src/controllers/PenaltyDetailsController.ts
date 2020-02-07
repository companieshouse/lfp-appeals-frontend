import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';
import * as Joi from '@hapi/joi';

const schema = Joi.object({
    companyNumber: Joi.string()
        .replace(' ', '')
        .insensitive()
        .uppercase()
        .min(1).max(8)
        .regex(/^(SC|NI)?[0-9]{6,8}/)
        .messages({
            'string.empty': 'You must enter a company number',
            'string.min': 'You must enter your full eight character company number',
            'string.max': 'You must enter your full eight character company number',
            'string.pattern.base': 'You must enter your full eight character company number'
        })
        ,

    penaltyReference: Joi.string()
        .replace(' ', '')
        .min(9).max(9)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.min': 'You must enter your reference number exactly as shown on your penalty notice',
            'string.max': 'You must enter your reference number exactly as shown on your penalty notice'
        })
});

const padNumber = (companyNumber: string):string => {
    if (/^(SC|NI)/gm.test(companyNumber)) {
        const leadingLetters = companyNumber.substring(0, 2);
        let trailingChars = companyNumber.substring(2, companyNumber.length);
        trailingChars = trailingChars.padStart(6, '0');
        companyNumber = leadingLetters + trailingChars;
    } else if(companyNumber.length > 0) {
        companyNumber = companyNumber.padStart(8, '0');
    }
    return companyNumber;
};



class ValidationError {
    constructor(public readonly field: string, public readonly text: string) { }

    get href(): string {
        return `#${this.field}-error`;
    }

}

 class ValidationResult {

    constructor(public readonly errors: ValidationError[] = []) { }

    public getErrorForField(field: string): ValidationError | undefined {

        return this.errors.find(error => error.field == field);
    }

}

@controller('/penalty-reference')
export class PenaltyDetailsController extends BaseHttpController {

    constructor(@inject(SessionService) private sessionService: SessionService) {
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(): void {

       // Check session for stored penalty details
      this.sessionService.getSession('1');

       // Set company number on view

       // Set reference number on view

        this.httpContext.response.render('penaltydetails');
    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const body: PenaltyReferenceDetails = this.httpContext.request.body;

        const validationResult = this.validate(body);
    
        this.httpContext.response.render('penaltydetails', { ...body, validationResult });
    }

    private validate(data: PenaltyReferenceDetails): ValidationResult {

        const results = schema.validate(
                {
                    companyNumber: padNumber(data.companyNumber),
                    penaltyReference: data.referenceNumber
                },
                {
                    abortEarly: false
                }
            )
        console.log(results.error?.message);
        
        const result: ValidationResult = new ValidationResult();

        if (!data.companyNumber) {

            result.errors.push(new ValidationError('companyNymber', 'You must enter a company nymber'));

        }

        return result;

        
    }

}

import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';
import * as Joi from '@hapi/joi';
import { penaltyDetailsSchema, padNumber } from '../utils/Schemas';
import { ValidationResult} from '../models/ValidationResult';
import { ValidationError} from '../models/ValidationError';
import { PENALTY_DETAILS_PREFIX} from '../utils/Paths';

@controller(PENALTY_DETAILS_PREFIX)
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

        const results: Joi.ValidationResult = penaltyDetailsSchema.validate(
            {
                companyNumber: padNumber(data.companyNumber),
                penaltyReference: data.penaltyReference
            },
            {
                abortEarly: false
            }
        )

        console.log(results.error?.details);


        const result: ValidationResult = new ValidationResult();

        results.error?.details.forEach((item: Joi.ValidationErrorItem) => {
            let path: string = item.path[0] as string;

            result.errors.push(new ValidationError(path, item.message));

        });
        return result;
    }

}
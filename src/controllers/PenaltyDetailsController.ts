import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';
import * as Joi from '@hapi/joi';
import { penaltyDetailsSchema, padNumber } from '../utils/Schemas';
import { ValidationResult} from '../models/ValidationResult';
import { ValidationError} from '../models/ValidationError';
import { PENALTY_DETAILS_PREFIX} from '../utils/Paths';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { Validate } from '../utils/Validate'

@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseHttpController {

    @httpGet('')
    public getPenaltyDetailsView(): void {

        this.httpContext.response.render('penaltydetails');
    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
            req.body.companyNumber, req.body.penaltyReference);

        const validationResult = Validate.validate(body);

        this.httpContext.response.render('penaltydetails', { ...body, validationResult });
    }

}
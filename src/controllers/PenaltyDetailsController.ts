import { Request, Response } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { Validate } from '../utils/Validate'
import { RedisService } from '../services/RedisService';

@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseHttpController {

    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(@request() req: Request, @response() res: Response): void {

        res.render('penaltydetails');
    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
            req.body.companyNumber, req.body.penaltyReference);

        const validationResult = Validate.validate(body);

        if (validationResult.errors.length < 1) {

            // save data to session here 
            // render page for now
            res.status(OK).render('penaltydetails');
        } else {
            res.status(BAD_REQUEST).render('penaltydetails', { ...body, validationResult });
        }

    }

}
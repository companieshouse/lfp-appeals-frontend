import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';
import {check, validationResult, body} from 'express-validator';
const Joi = require('@hapi/joi');

const schema = Joi.object({
    companyNumber: Joi.string()
        .replace(' ', '')
        .insensitive()
        .uppercase()
        .min(1).max(8)
        .pattern(new RegExp('^([a-zA-Z]{2})?[0-9]{6,8}'))
        .messages({
            'string.empty': 'You must enter a company number',
            'string.min': 'You must enter your full eight character company number',
            'string.max': 'You must enter your full eight character company number',
            'string.pattern.base': 'You must enter your full eight character company number'
        }),

    penaltyReference: Joi.string()
        .replace(' ', '')
        .min(9).max(9)
        .messages({
            'string.empty': 'You must enter a penalty reference number',
            'string.min': 'You must enter your reference number exactly as shown on your penalty notice',
            'string.max': 'You must enter your reference number exactly as shown on your penalty notice'
        })
})

const padNumber = (companyNumber: string):string => {
    if (/^([a-zA-Z]{2}?)/gm.test(companyNumber)) {
        const leadingLetters = companyNumber.substring(0, 2);
        let trailingChars = companyNumber.substring(2, companyNumber.length);
        trailingChars = trailingChars.padStart(6, '0');
        companyNumber = leadingLetters + trailingChars;
    } else {
        companyNumber = companyNumber.padStart(8, '0');
    }
    return companyNumber;
};


@controller('/penalty-reference')
export class PenaltyDetailsController extends BaseHttpController {

    constructor(@inject(SessionService) private sessionService: SessionService) {
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(req: Request, res: Response, next: NextFunction): void {

       // Check session for stored penalty details
      this.sessionService.getSession('1');

       // Set company number on view

       // Set reference number on view


        // es.sendStatus(200);
        // Return view
        res
        .status(OK)
        .render('penaltydetails');
    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const results = schema
            .validate(
                {
                    companyNumber: padNumber(req.body.companyNumber),
                    penaltyReference: req.body.penaltyReference
                },
                {
                    abortEarly: false
                }
            )
        console.log(results)

    }
}

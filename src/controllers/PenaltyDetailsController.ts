import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';
import {check, validationResult, body} from 'express-validator';


const preValidation = [
    body('companyNumber').blacklist(' ').escape().not().isEmpty().withMessage('You must enter a company number'),
    body('companyNumber').blacklist(' ').escape().isLength({max: 8}).withMessage('You must enter your full eight character company number'),
    body('penaltyReference').blacklist(' ').escape().not().isEmpty().withMessage('You must enter a penalty reference number'),
    body('penaltyReference').blacklist(' ').escape().isLength({min: 9, max: 9}).withMessage('You must enter your reference number exactly as shown on your penalty notice'),
];

const padCompanyNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let companyNumber: string = req.body.companyNumber;
    console.log("Pad: ", companyNumber)
    if (/^([a-zA-Z]{2}?)/gm.test(companyNumber)) {
      const leadingLetters = companyNumber.substring(0, 2);
      let trailingChars = companyNumber.substring(2, companyNumber.length);
      trailingChars = trailingChars.padStart(6, '0');
      companyNumber = leadingLetters + trailingChars;
    } else {
      companyNumber = companyNumber.padStart(8, '0');
    }
    console.log("Padded: ", companyNumber)
    req.body.companyNumber = companyNumber;
    return next();
  };

const postValidator = [
    body('companyNumber').blacklist(' ').escape().matches('^([a-zA-Z]{2})?[0-9]{6,8}').withMessage('You must enter your full eight character company number  TOOT')
]

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

    @httpPost('', ...preValidation, padCompanyNumber, ...postValidator)
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            console.log('non empty')
            console.log(errors)
        }
    }
}

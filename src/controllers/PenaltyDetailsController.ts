import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from "inversify";
import { TYPES } from '../constants/Types';
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';

@controller('/penalty-reference')
export class PenaltyDetailsController extends BaseHttpController {

    constructor(@inject(TYPES.SessionService) private sessionService: SessionService) {
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(req: Request, res: Response, next: NextFunction): void {

       // Check session for stored penalty details
      this.sessionService.getSession('1');

       // Set company number on view

       // Set reference number on view


//         res.sendStatus(200);
        // Return view
        res
        .status(OK)
        .render('penaltydetails');
    }

    @httpPost('')
    public async createPenaltyDetails(@request() req: Request, @response() res: Response) {

      const companyNumber = req.body.companyNumber;
      const penaltyReference = req.body.penaltyReference;

      console.log(companyNumber);
      console.log(penaltyReference);


//         validateCompanyNumber();
//
//         validateReferenceNumber();

        try {
            // create session
            this.sessionService.createSession(req.body);

            // return 201
            res.sendStatus(CREATED);
        } catch (err) {
            res.status(BAD_REQUEST).json({ error: err.message })}
    }
}

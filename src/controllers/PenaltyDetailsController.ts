import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject } from "inversify";
<<<<<<< HEAD
=======
import { TYPES } from '../constants/Types';
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
import { SessionService } from '../services/SessionService';
import { CREATED, BAD_REQUEST, OK } from 'http-status-codes';

@controller('/penalty-reference')
export class PenaltyDetailsController extends BaseHttpController {

<<<<<<< HEAD
    constructor(@inject(SessionService) private sessionService: SessionService) {
=======
    constructor(@inject(TYPES.SessionService) private sessionService: SessionService) {
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(req: Request, res: Response, next: NextFunction): void {

       // Check session for stored penalty details
      this.sessionService.getSession('1');

       // Set company number on view

       // Set reference number on view


<<<<<<< HEAD
        // es.sendStatus(200);
=======
//         res.sendStatus(200);
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
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

<<<<<<< HEAD
        this.validateCompanyNumber(companyNumber);
        this.validateReferenceNumber(penaltyReference);
=======

//         validateCompanyNumber();
//
//         validateReferenceNumber();
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68

        try {
            // create session
            this.sessionService.createSession(req.body);

            // return 201
            res.sendStatus(CREATED);
        } catch (err) {
            res.status(BAD_REQUEST).json({ error: err.message })}
    }
<<<<<<< HEAD


    validateCompanyNumber(companyNumber: string): void {

    }

    validateReferenceNumber(referenceNumber: string): void {
        
    }
    
=======
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
}

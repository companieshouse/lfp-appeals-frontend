import { Request, Response } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject, ContainerModule } from 'inversify';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { Validate } from '../utils/Validate'
import { RedisService } from '../services/RedisService';
import { SessionService } from '../services/SessionService';
import { IMap } from 'src/models/types';
import session = require('express-session');

@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseHttpController {

    constructor(@inject(SessionService) private readonly sessionService: SessionService) {
        super();
    }

    @httpGet('')
    public getPenaltyDetailsView(@request() req: Request, @response() res: Response): void {
 
        const cookieId = req.cookies['penalty-cookie']

        if (cookieId){
            console.log('Cookie found, loading session')
            const data: IMap<any> = this.sessionService.getSession(cookieId)
            const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
                data['companyNumber'], data['penaltyReference']);

            console.log(data['companyNumber'])
            console.log(data['penaltyReference'])

            res.render('penaltydetails', {...body});
        }
        else{
            console.log('No cookie found')
            res.render('penaltydetails');
        }
    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
            req.body.companyNumber, req.body.penaltyReference);

        const validationResult = Validate.validate(body);

        if (validationResult.errors.length < 1) {

            const cookieId = req.cookies['penalty-cookie']
            if (!cookieId){
                console.log('No cookie found, creating new session...')
                this.sessionService.createSession(body)
                res.cookie('penalty-cookie', 'test-cookie-id')
            }
            res.status(OK).render('penaltydetails') ;
        } else {
            res.status(BAD_REQUEST).render('penaltydetails', { ...body, validationResult });
        }

    }

}
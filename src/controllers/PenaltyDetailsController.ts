import { Request, Response } from 'express';
import { controller, httpGet, httpPost, BaseHttpController, request, response } from 'inversify-express-utils';
import { inject, ContainerModule } from 'inversify';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { Validate } from '../utils/Validate'
import { SessionService } from '../services/SessionService';
import { SessionMiddleware } from '../middleware/SessionMiddleware';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    constructor(@inject(SessionService) private readonly sessionService: SessionService) {
        super();
    }

    @httpGet('', SessionMiddleware)
    public async getPenaltyDetailsView(@request() req: Request, @response() res: Response): Promise<string> {

        const cookieId = req.cookies['penalty-cookie']

        if (cookieId) {
            console.log('Cookie found, loading session')
            const data = await this.sessionService.getSession(cookieId)
            console.log(data)
            const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
                data['companyNumber'], data['penaltyReference']);

            console.log(data['companyNumber'])
            console.log(data['penaltyReference'])
            return this.render('penaltydetails', { ...body});
        } else {
            console.log('No cookie')
        }

        return this.render('penaltydetails');

    }

    @httpPost('')
    public createPenaltyDetails(@request() req: Request, @response() res: Response): void {

        const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
            req.body.companyNumber, req.body.penaltyReference);

        const validationResult = Validate.validate(body);

        if (validationResult.errors.length < 1) {

            const cookieId = req.cookies['penalty-cookie']
            if (!cookieId) {
                console.log('No cookie found, creating new session...')
                this.sessionService.createSession(body)
                res.cookie('penalty-cookie', '1')
            }
            res.status(OK).render('penaltydetails');
        } else {
            res.status(BAD_REQUEST).render('penaltydetails', { ...body, validationResult });
        }

    }

}
import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, response } from 'inversify-express-utils';
import { inject} from 'inversify';
import { BAD_REQUEST, CREATED, OK, NO_CONTENT } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { Validate } from '../utils/Validate'
import { SessionService } from '../services/SessionService';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { IMap } from 'src/models/types';
import { ValidationResult } from 'src/models/ValidationResult';

@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    private COMPANY_NUMBER: string = 'companyNumber';
    private PENALTY_REFERENCE: string = 'penaltyReference';
    private COOKIE_NAME: string = 'penalty-cookie';
    private COOKIE_ID: string = '1';
    private PENALTY_TEMPLATE: string = 'penaltydetails';

    constructor(@inject(SessionService) private readonly sessionService: SessionService) {
        super();
    }

    @httpGet('')
    public async getPenaltyDetailsView(@request() req: Request, @response() res: Response): Promise<string> {

        const cookieId: string = req.cookies[this.COOKIE_NAME];

        if (cookieId) {

            console.log('Cookie found, loading session ...');


            const data: IMap<any> = await this.sessionService.getSession(cookieId);

            if(!data){
                console.log('No data found')
                res.cookie(this.COOKIE_NAME, cookieId, {expires: new Date(Date.now())})
            }
            else{
                const body: PenaltyReferenceDetails = {
                    companyNumber: data[this.COMPANY_NUMBER],
                    penaltyReference: data[this.PENALTY_REFERENCE]
                }

                return this.render(this.PENALTY_TEMPLATE, { ...body});
            }
        }

        return this.render(this.PENALTY_TEMPLATE);

    }

    @httpPost('')
    public async createPenaltyDetails(@request() req: Request, @response() res: Response): Promise<void> {

        const body: PenaltyReferenceDetails = {
            companyNumber: req.body.companyNumber,
            penaltyReference: req.body.penaltyReference
        }

        const validationResult: ValidationResult = Validate.validate(body);

        if (validationResult.errors.length < 1) {

            const cookieId: string = req.cookies[this.COOKIE_NAME];

            const data: IMap<any> = {
                penaltyReference: body.penaltyReference,
                companyNumber: body.companyNumber
            }

            if (!cookieId) {
                console.log('No cookie found, creating session ...');

                await this.sessionService.createSession(data);
                res.cookie(this.COOKIE_NAME, this.COOKIE_ID)
                this.renderWithStatus(CREATED)(this.PENALTY_TEMPLATE);
            }
            else{
                await this.sessionService.updateSession(data, cookieId)
                console.log('Updated session')
                this.renderWithStatus(NO_CONTENT)(this.PENALTY_TEMPLATE);
            }

        } else {
            console.log('Errors found')
            res.status(BAD_REQUEST).render(this.PENALTY_TEMPLATE, { ...body, validationResult });
        }

    }

}
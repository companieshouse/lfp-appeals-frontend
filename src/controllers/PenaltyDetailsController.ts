import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { BAD_REQUEST } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { IMap } from '../models/types';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { sanitize } from '../utils/CompanyNumberUtils';
import { RedisService } from '../services/RedisService';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { penaltyDetailsSchema } from '../utils/Schemas';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';


@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    private COMPANY_NUMBER: string = 'companyNumber';
    private PENALTY_REFERENCE: string = 'penaltyReference';
    private COOKIE_NAME: string = 'penalty-cookie';
    private COOKIE_ID: string = '1';
    private PENALTY_TEMPLATE: string = 'penaltydetails';

    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public async getPenaltyDetailsView(@request() req: Request, @response() res: Response): Promise<string> {

        const cookieId: string = req.cookies[this.COOKIE_NAME];

        if (cookieId) {

            console.log('Cookie found, loading session ...');

            const data: IMap<any> = await this.redisService.getObject(cookieId);

            if (!data) {
                console.log('No data found')
                res.cookie(this.COOKIE_NAME, cookieId, { expires: new Date(Date.now()) })
            } else {
                const body: PenaltyReferenceDetails = {
                    companyNumber: data[this.COMPANY_NUMBER],
                    penaltyReference: data[this.PENALTY_REFERENCE]
                }

                return this.render(this.PENALTY_TEMPLATE, { ...body });
            }
        }

        return this.render(this.PENALTY_TEMPLATE);

    }

    @httpPost('')
    public async createPenaltyDetails(@request() req: Request, @response() res: Response): Promise<any> {

        const body: PenaltyReferenceDetails = {
            companyNumber: sanitize(req.body.companyNumber),
            penaltyReference: req.body.penaltyReference
        }

        const validator = new SchemaValidator(penaltyDetailsSchema);

        const validationResult: ValidationResult =   validator.validate(body);

        console.log(validationResult)

        if (validationResult.errors.length < 1) {

            let cookieId: string = req.cookies[this.COOKIE_NAME];

            const data: IMap<any> = {
                penaltyReference: body.penaltyReference,
                companyNumber: body.companyNumber
            }

            if (!cookieId) {

                cookieId = this.generateCookieId();
                res.cookie(this.COOKIE_NAME, this.COOKIE_ID);
            }

            await this.redisService.setObject(cookieId, data).then(v => {
                console.log('Updated session')
                console.log(validationResult)

            });
            return this.redirect(PENALTY_DETAILS_PREFIX).executeAsync();


        } else {
            console.log('Errors found')
            return await this.renderWithStatus(BAD_REQUEST)(
                this.PENALTY_TEMPLATE, { cache: false, ...body, validationResult });
        }

    }

    generateCookieId(): string {
        return '1';
    }

}
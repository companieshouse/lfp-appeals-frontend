import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { sanitize } from '../utils/CompanyNumberUtils';
import { RedisService } from '../services/RedisService';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { schema } from '../models/PenaltyReferenceDetails.schema';


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
    public async getPenaltyDetailsView(): Promise<string> {

        const cookieId: string = this.httpContext.request.cookies[this.COOKIE_NAME];

        let body: PenaltyReferenceDetails = {
            companyNumber: '',
            penaltyReference: ''
        }

        if (cookieId) {

            const data: Record<string, any> = await this.redisService.getObject(cookieId);

            if (!data) {
                this.httpContext.response.cookie(this.COOKIE_NAME, cookieId, { expires: new Date(Date.now()) })
            } else {

                body = {
                    companyNumber: data[this.COMPANY_NUMBER],
                    penaltyReference: data[this.PENALTY_REFERENCE]
                }
            }
        }

        return this.render(this.PENALTY_TEMPLATE, { ...body });

    }

    @httpPost('')
    public async createPenaltyDetails(): Promise<any> {

        const request = this.httpContext.request;

        const body: PenaltyReferenceDetails = {
            companyNumber: sanitize(request.body.companyNumber),
            penaltyReference: request.body.penaltyReference
        }

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        if (validationResult.errors.length > 0) {

            return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                this.PENALTY_TEMPLATE, { cache: false, ...body, validationResult });
        }

        let cookieId: string = request.cookies[this.COOKIE_NAME];

        if (!cookieId) {

            cookieId = this.generateCookieId();
            this.httpContext.response.cookie(this.COOKIE_NAME, this.COOKIE_ID);
        }

        const data: Record<string, any> = {
            penaltyReference: body.penaltyReference,
            companyNumber: body.companyNumber
        }

        await this.redisService.setObject(cookieId, data);

        return this.redirect(PENALTY_DETAILS_PREFIX).executeAsync();
    }

    generateCookieId(): string {
        return '1';
    }

}
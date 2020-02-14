import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { PENALTY_DETAILS_PREFIX, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { sanitize } from '../utils/CompanyNumberSanitizer';
import { RedisService } from '../services/RedisService';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { schema } from '../models/PenaltyReferenceDetails.schema';


@controller(PENALTY_DETAILS_PREFIX)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    private COMPANY_NUMBER: string = 'companyNumber';
    private PENALTY_REFERENCE: string = 'penaltyReference';
    private COOKIE_NAME: string = 'penalty-cookie';
    private PENALTY_TEMPLATE: string = 'penalty-details';

    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public async getPenaltyDetailsView(): Promise<string> {

        const cookieId: string = this.httpContext.request.cookies[this.COOKIE_NAME];

        let body: PenaltyReferenceDetails = {
            companyNumber: '',
            penaltyReference: ''
        };

        if (cookieId) {
            const data: Record<string, any> = await this.redisService.getObject(cookieId);

            if (data) {
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

        const body: PenaltyReferenceDetails = {
            companyNumber: this.httpContext.request.body.companyNumber,
            penaltyReference: this.httpContext.request.body.penaltyReference
        };

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        if (validationResult.errors.length > 0) {

            return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                this.PENALTY_TEMPLATE, { ...body, validationResult });
        }

        let cookieId: string = this.httpContext.request.cookies[this.COOKIE_NAME];

        if (!cookieId) {
            cookieId = '1';
            this.httpContext.response.cookie(this.COOKIE_NAME, cookieId);
        }

        await this.redisService.setObject(cookieId, { ...body, companyNumber: sanitize(body.companyNumber) });

        return this.redirect(OTHER_REASON_DISCLAIMER_PAGE_URI).executeAsync();
    }
}

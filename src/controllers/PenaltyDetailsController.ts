import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';
import { schema } from '../models/PenaltyReferenceDetails.schema';
import { Request, Response, NextFunction } from 'express';
import { Cookie } from 'ch-node-session/lib/session/model/Cookie';
import { VerifiedSession } from 'ch-node-session/lib/session/model/Session';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { SessionMiddleware, SessionStore } from 'ch-node-session';


@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    private COMPANY_NUMBER: string = 'companyNumber';
    private PENALTY_REFERENCE: string = 'penaltyReference';
    private COOKIE_NAME: string = 'penalty-cookie';
    private PENALTY_TEMPLATE: string = 'penalty-details';

    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    @httpGet('')
    public async getPenaltyDetailsView(req: Request, res: Response): Promise<string> {

        const body: PenaltyReferenceDetails = {
            companyNumber: '',
            penaltyReference: ''
        };

        const sessionData = req.session
            .chain(session => session.getExtraData())
            .map(data => data[this.COOKIE_NAME]);

        return await this.render(this.PENALTY_TEMPLATE,
            sessionData.isJust() ? { ...sessionData.__value } : { ...body });


    }

    @httpPost('')
    public async createPenaltyDetails(req: Request): Promise<any> {

        const body: PenaltyReferenceDetails = {
            companyNumber: this.httpContext.request.body.companyNumber,
            penaltyReference: this.httpContext.request.body.penaltyReference
        };

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        if (validationResult.errors.length > 0) {

            return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                this.PENALTY_TEMPLATE, { ...body, validationResult });
        }

        req.session.map(async (session: VerifiedSession) => {
            session.saveExtraData(this.COOKIE_NAME, body);
            await this.sessionStore.store(Cookie.asCookie(session), session.data).run();
        });

        return await this.redirect(OTHER_REASON_DISCLAIMER_PAGE_URI).executeAsync();
    }
}

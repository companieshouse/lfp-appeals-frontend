import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { Request } from 'express';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { PenaltyIdentifier } from '../models/PenaltyIdentifier';
import { SessionMiddleware, SessionStore, Maybe } from 'ch-node-session-handler';
import { schema } from '../models/PenaltyIdentifier.schema';
import { AppealKeys } from '../models/keys/AppealKeys';
import { Appeal } from '../models/Appeal';

@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class PenaltyDetailsController extends BaseAsyncHttpController {

    private PENALTY_TEMPLATE: string = 'penalty-details';

    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    @httpGet('')
    public async getPenaltyDetailsView(req: Request): Promise<string> {
        const session = req.session.unsafeCoerce();

        const penIdentifier = session
            .getExtraData()
            .chain(data => Maybe.fromNullable(data[AppealKeys.APPEALS_KEY]))
            .mapOrDefault(appeals => appeals[AppealKeys.PENALTY_IDENTIFIER], {});

        return await this.render(this.PENALTY_TEMPLATE, penIdentifier);
    }

    @httpPost('')
    public async createPenaltyDetails(req: Request): Promise<any> {

        const body: PenaltyIdentifier = {
            companyNumber: this.httpContext.request.body.companyNumber,
            penaltyReference: this.httpContext.request.body.penaltyReference
        };

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        if (validationResult.errors.length > 0) {

            return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                this.PENALTY_TEMPLATE, { ...body, validationResult });
        };

        const session = req.session.unsafeCoerce();
        const extraData = session.getExtraData();

        const changePenaltyIdentifier = (appeals: Appeal) => {
            appeals[AppealKeys.PENALTY_IDENTIFIER] = body;
            return Maybe.of(appeals);
        };

        const appealObject = extraData
            .chainNullable(data => data[AppealKeys.APPEALS_KEY])
            .mapOrDefault(changePenaltyIdentifier, Maybe.of({
                [AppealKeys.PENALTY_IDENTIFIER]: body
            } as Appeal))
            .mapOrDefault(_ => _, {} as Appeal);

        session.saveExtraData(AppealKeys.APPEALS_KEY, appealObject);

        await this.sessionStore.store(Cookie.createFrom(session), session.data).run();

        return await this.redirect(OTHER_REASON_DISCLAIMER_PAGE_URI).executeAsync();
    }
}

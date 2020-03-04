import { Maybe, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { schema } from 'app/models/PenaltyIdentifier.schema';
import { sanitize } from 'app/utils/CompanyNumberSanitizer';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

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
            .chain<Appeal>(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .mapOrDefault<PenaltyIdentifier>((appeal: Appeal) => appeal.penaltyIdentifier, {} as PenaltyIdentifier);

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

        const changePenaltyIdentifier = (appeal: Appeal) => {

            const companyNumber = sanitize(body.companyNumber);
            const penaltyReference = body.penaltyReference;

            appeal.penaltyIdentifier.companyNumber = companyNumber;
            appeal.penaltyIdentifier.penaltyReference = penaltyReference;

            return Maybe.of(appeal);
        };

        const appealObject = extraData
            .chainNullable<Appeal>(data => data[APPEALS_KEY])
            .mapOrDefault(changePenaltyIdentifier, Maybe.of({
                penaltyIdentifier: {
                    companyNumber: sanitize(body.companyNumber),
                    penaltyReference: body.penaltyReference
                }
            } as Appeal))
            .mapOrDefault(_ => _, {} as Appeal);

        session.saveExtraData(APPEALS_KEY, appealObject);
        const cookie = Cookie.representationOf(session, getEnvOrDefault('COOKIE_SECRET'));

        await this.sessionStore
            .store(cookie, session.data)
            .run();

        return await this.redirect(OTHER_REASON_DISCLAIMER_PAGE_URI).executeAsync();
    }
}

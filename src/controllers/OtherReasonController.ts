import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_PAGE_URI } from '../utils/Paths';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { OtherReason } from '../models/OtherReason';
import { schema } from '../models/OtherReason.schema';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { Request } from 'express';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const sessionKey = 'session::other-reason';

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends BaseHttpController {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    @httpGet('')
    public async renderForm(req: Request): Promise<void> {

        const data = req.session
            .chain(session => session.getExtraData())
            .map(extraData => extraData[sessionKey]);

        return await this.render(OK, data.isJust() ? data.__value : {});

    }

    @httpPost('')
    public async handleFormSubmission(req: Request): Promise<void> {
        const body: OtherReason = req.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);
        const valid = validationResult.errors.length === 0;

        if (valid) {
            req.session.map(async session => {
                session.saveExtraData(sessionKey, body);
                await this.sessionStore.store(Cookie.createFrom(session), session.data).run();
            });
        }

        return this.render(valid ? OK : UNPROCESSABLE_ENTITY, {...body, validationResult});
    }

    private async render(status: number, data: object): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpContext.response.status(status).render('other-reason', data, (err, compiled) => {
                if (err) {
                    reject(err);
                }
                resolve(compiled as any);
            });
        });
    }
}
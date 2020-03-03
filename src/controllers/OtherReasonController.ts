import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_PAGE_URI, CHECK_YOUR_APPEAL_PAGE_URI } from 'app/utils/Paths';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationResult } from 'app/utils/validation/ValidationResult';
import { OtherReason } from 'app/models/OtherReason';
import { schema } from 'app/models/OtherReason.schema';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { Request } from 'express';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { SessionMiddleware, SessionStore, Maybe } from 'ch-node-session-handler';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends BaseHttpController {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    @httpGet('')
    public async renderForm(req: Request): Promise<void> {
        const data = req.session
            .chain(session => session.getExtraData())
            .chainNullable(extraData => extraData[APPEALS_KEY])
            .chainNullable(appeal => appeal.reasons)
            .chainNullable(reasons => reasons.other);

        return await this.render(OK, data.orDefault({}));

    }

    @httpPost('')
    public async handleFormSubmission(req: Request): Promise<any> {
        const body: OtherReason = req.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);
        const valid = validationResult.errors.length === 0;

        if (valid) {

            const session = req.session.unsafeCoerce();
            const extraData = session.getExtraData();

            const appeals = (data: any) => Maybe.fromNullable(data[APPEALS_KEY])
                .mapOrDefault<Appeal>(
                    appeal => {
                        if (!appeal.reasons) {
                            appeal.reasons = {};
                        }
                        return appeal;
                    },
                    {
                        reasons: {}
                    } as Appeal
                );

            const appealsObj = extraData
                .chainNullable<Appeal>(appeals)
                .mapOrDefault(appeal => {
                    appeal.reasons.other = body;
                    return appeal;
                }, {} as Appeal);

            session.saveExtraData(APPEALS_KEY, appealsObj);

            await this.sessionStore
                .store(Cookie.representationOf(session, getEnvOrDefault('COOKIE_SECRET')), session.data)
                .run();
        }

        if (valid) {
            return this.redirect(CHECK_YOUR_APPEAL_PAGE_URI).executeAsync();
        }

        return this.render(UNPROCESSABLE_ENTITY, { ...body, validationResult });
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

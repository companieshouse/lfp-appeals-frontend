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
import { SessionMiddleware, SessionStore, Maybe } from 'ch-node-session-handler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AppealKeys } from '../models/keys/AppealKeys';
import { ReasonsKeys } from '../models/keys/ReasonsKeys';
import { Appeal } from '../models/Appeal';

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends BaseHttpController {
    constructor(@inject(SessionStore) private readonly sessionStore: SessionStore) {
        super();
    }

    @httpGet('')
    public async renderForm(req: Request): Promise<void> {
        const data = req.session
            .chain(session => session.getExtraData())
            .chainNullable(extraData => extraData[AppealKeys.APPEALS_KEY])
            .chainNullable(appeals => appeals[AppealKeys.REASONS])
            .chainNullable(reasons => reasons[ReasonsKeys.OTHER]);

        return await this.render(OK, data.orDefault({}));

    }

    @httpPost('')
    public async handleFormSubmission(req: Request): Promise<void> {
        const body: OtherReason = req.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);
        const valid = validationResult.errors.length === 0;

        if (valid) {

            const session = req.session.unsafeCoerce();
            const extraData = session.getExtraData();

            const checkAppealsKey = (data: any) => Maybe.fromNullable(data[AppealKeys.APPEALS_KEY])
                .mapOrDefault<Appeal>(
                    appeal => {
                        if (!appeal[AppealKeys.REASONS]) {
                            appeal[AppealKeys.REASONS] = {};
                        }
                        return appeal;
                    },
                    {
                        [AppealKeys.REASONS]: {}
                    } as Appeal
                );

            const appealsObj = extraData
                .chainNullable<Appeal>(checkAppealsKey)
                .mapOrDefault(appeals => {
                    appeals[AppealKeys.REASONS][ReasonsKeys.OTHER] = body;
                    return appeals;
                }, {} as Appeal);

            session.saveExtraData(AppealKeys.APPEALS_KEY, appealsObj);

            await this.sessionStore.store(Cookie.createFrom(session), session.data).run();
        }

        return this.render(valid ? OK : UNPROCESSABLE_ENTITY, { ...body, validationResult });
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
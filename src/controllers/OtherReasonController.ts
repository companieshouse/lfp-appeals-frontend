import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_PAGE_URI } from '../utils/Paths';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { OtherReason } from '../models/OtherReason';
import { schema } from '../models/OtherReason.schema';
import { RedisService } from '../services/RedisService';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';

const sessionKey = 'session::other-reason';

@controller(OTHER_REASON_PAGE_URI)
export class OtherReasonController extends BaseHttpController {
    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public async renderForm(): Promise<void> {
        const session = await this.redisService.get(sessionKey);

        return this.render(OK,session ? JSON.parse(session) : {})
    }

    @httpPost('')
    public async handleFormSubmission(): Promise<void> {
        const body: OtherReason = this.httpContext.request.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);
        const valid = validationResult.errors.length === 0;

        if (valid) {
            await this.redisService.set(sessionKey, JSON.stringify(body))
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
            })
        });
    }
}
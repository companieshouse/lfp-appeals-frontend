import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_CATEGORY_PREFIX, OTHER_REASON_PAGE_PREFIX } from '../utils/Paths';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { OtherReason } from '../models/OtherReason';
import { schema } from '../models/OtherReason.schema';
import { RedisService } from '../services/RedisService';

const sessionKey = 'session::other-reason';

@controller(OTHER_REASON_CATEGORY_PREFIX)
export class OtherReasonController extends BaseHttpController {
    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet(OTHER_REASON_PAGE_PREFIX)
    public async renderForm(): Promise<void> {
        const session = await this.redisService.get(sessionKey);

        return this.render(session ? JSON.parse(session) : {})
    }

    @httpPost(OTHER_REASON_PAGE_PREFIX)
    public async handleFormSubmission(): Promise<void> {
        const body: OtherReason = this.httpContext.request.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        if (validationResult.errors.length === 0) {
            await this.redisService.set(sessionKey, JSON.stringify(body))
        }

        return this.render({...body, validationResult});
    }

    private async render(data: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpContext.response.render('other-reason', data, (err, compiled) => {
                if (err) {
                    reject(err);
                }
                resolve(compiled as any);
            })
        });
    }
}
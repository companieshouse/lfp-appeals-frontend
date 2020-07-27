import { SessionMiddleware } from 'ch-node-session-handler';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { schema } from 'app/models/fields/Reason.schema';
import { CHOOSE_REASON_PAGE_URI } from 'app/utils/Paths';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const template = 'choose-appeal-reason';

@controller(CHOOSE_REASON_PAGE_URI, IllnessReasonFeatureMiddleware, SessionMiddleware, AuthMiddleware)
export class ChooseAppealReasonController extends BaseAsyncHttpController{

    @httpGet('')
    public async renderView(): Promise<void> {
        return this.render(template);
    }

    @httpPost('')
    public async continue(): Promise<void> {
        const request = this.httpContext.request;
        const validationResult: ValidationResult = await new FormValidator(schema).validate(request);

        if (validationResult.errors.length > 0) {
            return this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                template, { validationResult });
        } else {
            return this.renderWithStatus(OK)(template);
        }
    }
}
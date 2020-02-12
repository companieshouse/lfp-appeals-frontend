import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_PAGE } from '../utils/Paths';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { OtherReason } from '../models/OtherReason';
import { schema } from '../models/OtherReason.schema';

@controller(OTHER_REASON_PAGE)
export class OtherReasonController extends BaseHttpController {

    @httpGet('')
    public renderForm(): void {
        this.httpContext.response.render('other-reason');
    }

    @httpPost('')
    public handleFormSubmission(): void {
        const body: OtherReason = this.httpContext.request.body;

        const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

        this.httpContext.response.render('other-reason', {...body, validationResult});
    }
}
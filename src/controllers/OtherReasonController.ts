import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';
import { SchemaValidator } from '../utils/validation/SchemaValidator';
import { ValidationResult } from '../utils/validation/ValidationResult';
import { schema } from '../models/OtherReason.schema';

@controller('/other-reason')
export class OtherReasonController extends BaseHttpController {

  @httpGet('')
  public renderForm(): void {
    this.httpContext.response.render('other-reason');
  }

  @httpPost('')
  public handleFormSubmission(): void {
    const body: OtherReason = this.httpContext.request.body;

    const validationResult: ValidationResult = new SchemaValidator(schema).validate(body);

    this.httpContext.response.render('other-reason', { ...body, validationResult });
  }
}

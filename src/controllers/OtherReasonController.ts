import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';

class ValidationError {
  constructor (public readonly field: string, public readonly text: string) {}

  get href(): string {
    return `#${this.field}-error`;
  }
}

class ValidationResult {
  constructor (public readonly errors: ValidationError[] = []) {}

  public getErrorForField(field: string): ValidationError | undefined {
    return this.errors.find(error => error.field === field);
  }
}

@controller('/other-reason')
export class OtherReasonController extends BaseHttpController {

  @httpGet('')
  public renderForm(): void {
    this.httpContext.response.render('other-reason');
  }

  @httpPost('')
  public handleFormSubmission(): void {
    const body: OtherReason = this.httpContext.request.body;

    const validationResult = this.validate(body);

    this.httpContext.response.render('other-reason', { ...body, validationResult });
  }

  private validate(data: OtherReason): ValidationResult {
    const result: ValidationResult = new ValidationResult();
    if (!data.reason) {
      result.errors.push(new ValidationError('reason', 'You must give your reason a title'));
    }
    if (!data.description) {
      result.errors.push(new ValidationError('description', 'You must give us more information'));
    }
    return result;
  }
}


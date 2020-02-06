import { BaseHttpController, controller, httpGet, httpPost } from 'inversify-express-utils';

@controller('/other-reason')
export class OtherReasonController extends BaseHttpController {

  @httpGet('')
  public renderForm(): void {
    this.httpContext.response.render('other-reason');
  }

  @httpPost('')
  public handleFormSubmission(): void {
    const body: OtherReason = this.httpContext.request.body
    this.httpContext.response.render('other-reason', body);
  }

}

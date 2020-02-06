import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';

@controller('/other-reason')
export class OtherReasonController extends BaseHttpController {

  @httpGet('')
  public renderView(): void {
    this.httpContext.response.render('other-reason');
  }

}

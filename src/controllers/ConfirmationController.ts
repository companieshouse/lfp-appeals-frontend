import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';

@controller(CONFIRMATION_PAGE_URI)
export class ConfirmationController extends BaseHttpController {

  @httpGet('')
  public getConfirmationView(): void {

    const companyNumber: string = this.httpContext.request.app.locals.session.companyNumber;

    this.httpContext.response.render('confirmation', {companyNumber});
  }
}
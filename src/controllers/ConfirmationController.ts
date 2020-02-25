import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';

@controller(CONFIRMATION_PAGE_URI)
export class ConfirmationController extends BaseHttpController {

    @httpGet('')
    public getConfirmationView(): void {

        const session = this.httpContext.request.session;
        let companyNumber: string = '';

        if (session) {
            companyNumber = session.getExtraData('appeals').penaltyIdentifier.companyNumber;
        }

        this.httpContext.response.render('confirmation', { companyNumber });
    }
}

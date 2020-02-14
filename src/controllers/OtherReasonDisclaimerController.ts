import { controller, BaseHttpController, httpGet, httpPost } from 'inversify-express-utils';
import { OTHER_REASON_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../utils/Paths';

@controller(OTHER_REASON_DISCLAIMER_PAGE_URI)
export class OtherReasonDisclaimerController extends BaseHttpController {
    constructor() {
        super();
    }

    @httpGet('')
    public showDisclaimer(): void {
        this.httpContext.response.render('other-reason-disclaimer');
    }

    @httpPost('')
    public continue(): void {
        this.httpContext.response.redirect('/other/reason-other');
    }
}

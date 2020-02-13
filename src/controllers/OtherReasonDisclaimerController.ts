import { controller, BaseHttpController, httpGet } from 'inversify-express-utils';
import { OTHER_REASON_CATEGORY_PREFIX, OTHER_REASON_DISCLAIMER_PAGE_PREFIX } from '../utils/Paths';

@controller(OTHER_REASON_CATEGORY_PREFIX)
export class OtherReasonDisclaimerController extends BaseHttpController {
    constructor() {
        super();
    }

    @httpGet(OTHER_REASON_DISCLAIMER_PAGE_PREFIX)
    public showDisclaimer(): void {
        this.httpContext.response.render('other-reason-disclaimer');
    }
}

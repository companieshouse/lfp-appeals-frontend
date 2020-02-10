import { controller, BaseHttpController, httpGet } from 'inversify-express-utils';
import { OTHER_REASON_PREFIX, OTHER_REASON_ENTRY_PREFIX } from '../utils/Paths';

@controller(OTHER_REASON_PREFIX)
export class OtherReasonController extends BaseHttpController {
    constructor() {
        super();
    }

    @httpGet(OTHER_REASON_ENTRY_PREFIX)
    public showDisclaimer(): void {
        this.httpContext.response.render('other-reason-disclaimer');
    }
}

import { SessionMiddleware } from 'ch-node-session-handler';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

@controller(OTHER_REASON_DISCLAIMER_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonDisclaimerController extends BaseAsyncHttpController {
    constructor() {
        super();
    }

    @httpGet('')
    public async showDisclaimer(): Promise<string> {
        return await this.render('other-reason-disclaimer');
    }

    @httpPost('')
    public async continue(): Promise<any> {
        return await this.redirect(OTHER_REASON_PAGE_URI).executeAsync();
    }
}

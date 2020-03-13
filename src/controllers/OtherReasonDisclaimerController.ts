import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, OTHER_REASON_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

const template = 'other-reason-disclaimer';

const navigation = {
    previous(): string {
        return PENALTY_DETAILS_PAGE_URI;
    },
    next(): string {
        return OTHER_REASON_PAGE_URI;
    }
};

@controller(OTHER_REASON_DISCLAIMER_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonDisclaimerController extends BaseController<any> {
    constructor() {
        super(template, navigation);
    }

    protected prepareViewModelFromAppeal(): any {
        return {};
    }
}

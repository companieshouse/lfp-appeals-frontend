import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
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
export class OtherReasonDisclaimerController extends SafeNavigationBaseController<PenaltyIdentifier>{
    constructor() {
        super(template, navigation);
    }
}

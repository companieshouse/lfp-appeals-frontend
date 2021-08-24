import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import {
    CHOOSE_REASON_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    REVIEW_PENALTY_PAGE_URI
} from 'app/utils/Paths';

const template = 'other-reason-disclaimer';

const navigation = {
    previous(request: Request): string {
        return (request.app.locals.featureFlags.illnessReasonEnabled)
            ? CHOOSE_REASON_PAGE_URI
            : REVIEW_PENALTY_PAGE_URI;
    },
    next(): string {
        return OTHER_REASON_PAGE_URI;
    }
};

@controller(OTHER_REASON_DISCLAIMER_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class OtherReasonDisclaimerController extends SafeNavigationBaseController<PenaltyIdentifier>{
    constructor() {
        super(template, navigation);
    }
}

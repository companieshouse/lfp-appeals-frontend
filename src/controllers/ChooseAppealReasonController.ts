import { SessionMiddleware } from 'ch-node-session-handler';
import { request } from 'express';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { Reason } from 'app/models/fields/Reason';
import { schema } from 'app/models/fields/Reason.schema';
import { Feature } from 'app/utils/Feature';
import {
    CHOOSE_REASON_PAGE_URI,
    ILL_PERSON_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'choose-appeal-reason';

const navigation: Navigation = {
    previous(): string {
        return REVIEW_PENALTY_PAGE_URI;
    },
    next(): string {
        switch(request.body.reason) {
            case Reason.illness:
                return ILL_PERSON_PAGE_URI;
            default:
                return OTHER_REASON_DISCLAIMER_PAGE_URI;
        }
    },
    actions: (_: boolean) => {
        return {
            continue:'action=continue'
        };
    }
};

@controller(CHOOSE_REASON_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware, AuthMiddleware)
export class ChooseAppealReasonController extends BaseController<any>{

    constructor() {
        super(template, navigation, new FormValidator(schema));
    }
}

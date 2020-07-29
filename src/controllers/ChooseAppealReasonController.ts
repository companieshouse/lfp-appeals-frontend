import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { schema } from 'app/models/fields/Reason.schema';
import { Feature } from 'app/utils/Feature';
import { CHOOSE_REASON_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'choose-appeal-reason';

const navigation: Navigation = {
    previous(): string {
        return '';
    },
    next(): string {
        return '';
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

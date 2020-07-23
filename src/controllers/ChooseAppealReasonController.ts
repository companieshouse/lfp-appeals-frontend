import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { schema as formSchema } from 'app/models/fields/Reason.schema';
import { CHOOSE_REASON_PAGE_URI, OTHER_REASON_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

const template = 'choose-appeal-reason';

const navigation = {
    previous(): string {
        return REVIEW_PENALTY_PAGE_URI;
    },
    next(): string {
        return OTHER_REASON_PAGE_URI;
    },
    actions: (_: boolean) => {
        return {
            continue: 'action=continue'
        };
    }
};

@controller(CHOOSE_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ChooseAppealReasonController extends SafeNavigationBaseController<any> {

    constructor() {
        super(template,
            navigation,
            new FormValidator(formSchema)
        );
    }
}
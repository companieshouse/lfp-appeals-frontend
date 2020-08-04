import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { schema } from 'app/models/fields/Reason.schema';
import { ReasonType } from 'app/models/fields/ReasonType';
import { Feature } from 'app/utils/Feature';
import { CHOOSE_REASON_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'choose-appeal-reason';

const navigation: Navigation = {
    previous(): string {
        return REVIEW_PENALTY_PAGE_URI;
    },
    next(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    actions: (_: boolean) => {
        return {
            continue:'action=continue'
        };
    }
};

interface FormBody {
    reason: ReasonType;
}

@controller(CHOOSE_REASON_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware, AuthMiddleware,
CompanyAuthMiddleware)
export class ChooseAppealReasonController extends BaseController<FormBody>{

    constructor() {
        super(template, navigation, new FormValidator(schema));
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: FormBody): Appeal {
        appeal.currentReasonType = value.reason;

        loggerInstance()
            .debug(`${ChooseAppealReasonController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}

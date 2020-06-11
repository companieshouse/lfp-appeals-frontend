import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason';
import { schema as formSchema } from 'app/models/OtherReason.schema';
import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';
import {
    CHECK_YOUR_APPEAL_PAGE_URI, EVIDENCE_QUESTION_URI, OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

const template = 'other-reason';

const navigation = {
    previous(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    next(): string {
        if (isFeatureEnabled(Feature.FILE_TRANSFER)) {
            return EVIDENCE_QUESTION_URI;
        }
        return CHECK_YOUR_APPEAL_PAGE_URI;
    }
};

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends SafeNavigationBaseController<OtherReason> {
    constructor() {
        super(template, navigation, new FormValidator(formSchema));
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: OtherReason): Appeal {
        if (appeal.reasons?.other != null) {
            appeal.reasons.other.title = value.title;
            appeal.reasons.other.description = value.description;
        } else {
            appeal.reasons = {
                other: value
            };
        }
        loggerInstance()
            .debug(`${OtherReasonController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}

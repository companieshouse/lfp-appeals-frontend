import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason';
import { schema as formSchema } from 'app/models/OtherReason.schema';
import {
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { getAttachmentsFromReasons } from 'app/utils/appeal/extra.data';

const template = 'other-reason';

const navigation = {
    previous(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_QUESTION_URI;
    }
};

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class OtherReasonController extends SafeNavigationBaseController<OtherReason> {
    constructor() {
        super(template, navigation, new FormValidator(formSchema));
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const otherReason = appeal.reasons?.other;
        const name = appeal.createdBy?.name;

        return { ...otherReason, name };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {
        const attachments = getAttachmentsFromReasons(appeal.reasons) || [];
        if (appeal.reasons?.other != null) {
            appeal.reasons.other.title = value.title;
            appeal.reasons.other.description = value.description;
        } else {
            appeal.reasons = {
                other: value
            };
            appeal.reasons.other.attachments = [ ...attachments ];
        }

        appeal.createdBy = {
            ...appeal.createdBy,
            name: value.name
        };

        loggerInstance()
            .debug(`${OtherReasonController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);

        return appeal;
    }
}

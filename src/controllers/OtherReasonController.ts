import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { loggerInstance, loggingErrorMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason';
import { schema as formSchema } from 'app/models/OtherReason.schema';
import {
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

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

        appeal.reasons.other!.title = value.title;
        appeal.reasons.other!.description = value.description;

        appeal.createdBy = {
            ...appeal.createdBy,
            name: value.name
        };

        loggerInstance()
            .debug(`${OtherReasonController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);

        loggerInstance().error(loggingErrorMessage(appeal, `${OtherReasonController.name}`));

        return appeal;
    }
}

import { SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { UpdateSessionFormSubmissionProcessor } from 'app/controllers/processors/UpdateSessionFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason';
import { schema as formSchema } from 'app/models/OtherReason.schema';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

const template = 'other-reason';

const navigation = {
    previous(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    next(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    }
};

@provide(FormSubmissionProcessor)
class FormSubmissionProcessor extends UpdateSessionFormSubmissionProcessor<OtherReason> {
    constructor(@inject(SessionStore) sessionStore: SessionStore) {
        super(sessionStore);
    }

    protected prepareModelPriorSessionSave(appeal: Appeal, value: OtherReason): Appeal {
        const model = {
            ...appeal,
            reasons: {
                other: value
            }
        };
        loggerInstance()
            .debug(`${OtherReasonController.name} - prepareModelPriorSessionSave: ${JSON.stringify(model)}`);
        return model;
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends SafeNavigationBaseController<OtherReason> {
    constructor() {
        super(template, navigation, formSchema, undefined, [FormSubmissionProcessor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        loggerInstance()
            .debug(`${OtherReasonController.name} - prepareViewModelFromAppeal: ${JSON.stringify(appeal.reasons?.other)}`);
        return appeal.reasons?.other;
    }
}

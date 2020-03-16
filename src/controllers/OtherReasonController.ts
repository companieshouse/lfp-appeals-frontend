import { SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { UpdateSessionFormSubmissionProcessor } from 'app/controllers/processors/UpdateSessionFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
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
        return {
            ...appeal,
            reasons: {
                other: value
            }
        };
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class OtherReasonController extends SafeNavigationBaseController<OtherReason> {
    constructor() {
        super(template, navigation, formSchema, undefined, [FormSubmissionProcessor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }
}

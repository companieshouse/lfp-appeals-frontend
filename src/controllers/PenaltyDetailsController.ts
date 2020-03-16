import { SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { UpdateSessionFormSubmissionProcessor } from 'app/controllers/processors/UpdateSessionFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { schema as formSchema } from 'app/models/PenaltyIdentifier.schema';
import { sanitize } from 'app/utils/CompanyNumberSanitizer';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI, ROOT_URI } from 'app/utils/Paths';

const template = 'penalty-details';

const navigation = {
    previous(): string {
        return ROOT_URI;
    },
    next(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    }
};

const sanitizeForm = (body: PenaltyIdentifier) => {
    return {
        companyNumber: sanitize(body.companyNumber),
        penaltyReference: body.penaltyReference.toUpperCase()
    }
};

@provide(FormSubmissionProcessor)
class FormSubmissionProcessor extends UpdateSessionFormSubmissionProcessor<PenaltyIdentifier> {
    constructor(@inject(SessionStore) sessionStore: SessionStore) {
        super(sessionStore);
    }

    protected prepareModelPriorSessionSave(appeal: Appeal, value: any): Appeal {
        return { ...appeal, penaltyIdentifier: value };
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class PenaltyDetailsController extends SafeNavigationBaseController<PenaltyIdentifier> {
    constructor() {
        super(template, navigation, formSchema, sanitizeForm, [FormSubmissionProcessor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & PenaltyIdentifier {

        return appeal.penaltyIdentifier;
    }
}

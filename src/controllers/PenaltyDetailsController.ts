import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AppealDetailActionProcessor } from 'app/controllers/processors/AppealDetailActionProcessor';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { schema as formSchema } from 'app/models/PenaltyIdentifier.schema';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';
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
        companyNumber: sanitizeCompany(body.companyNumber),
        penaltyReference: body.penaltyReference.toUpperCase()
    };

};

@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class PenaltyDetailsController extends SafeNavigationBaseController<PenaltyIdentifier> {
    constructor() {
        super(template, navigation, new FormValidator(formSchema), sanitizeForm, [AppealDetailActionProcessor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & PenaltyIdentifier {
        return appeal.penaltyIdentifier;
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {
        appeal.penaltyIdentifier = value;
        loggerInstance()
            .debug(`${PenaltyDetailsController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}

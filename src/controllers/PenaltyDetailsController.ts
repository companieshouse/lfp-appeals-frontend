import { SessionMiddleware } from 'ch-node-session-handler';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { CompanyNameProcessor } from 'app/controllers/processors/CompanyNameProcessor';
import { PenaltyDetailsValidator } from 'app/controllers/validators/PenaltyDetailsValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';
import { PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI, ROOT_URI } from 'app/utils/Paths';

const template = 'penalty-details';

const navigation = {
    previous(): string {
        return ROOT_URI;
    },
    next(): string {
        return REVIEW_PENALTY_PAGE_URI;
    }
};

const sanitizeForm = (body: PenaltyIdentifier): PenaltyIdentifier => {

    return {
        companyNumber: sanitizeCompany(body.companyNumber),
        penaltyReference: body.penaltyReference.toUpperCase(),
        penaltyList: body.penaltyList
    };

};

@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class PenaltyDetailsController extends SafeNavigationBaseController<PenaltyIdentifier> {
    constructor(@inject(PenaltyDetailsValidator) penaltyDetailsValidator: PenaltyDetailsValidator) {
        super(
            template,
            navigation,
            penaltyDetailsValidator,
            sanitizeForm,
            [CompanyNameProcessor]
        );
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

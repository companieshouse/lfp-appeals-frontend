import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { inject } from "inversify";
import { controller } from "inversify-express-utils";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { CompanyNameProcessor } from "app/controllers/processors/CompanyNameProcessor";
import { PenaltyDetailsValidator } from "app/controllers/validators/PenaltyDetailsValidator";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { PenaltyIdentifier } from "app/models/PenaltyIdentifier";
import { sanitizeCompany } from "app/utils/CompanyNumberSanitizer";
import { PENALTY_DETAILS_PAGE_URI, ROOT_URI, SELECT_THE_PENALTY_PAGE_URI, SIGNOUT_PAGE_URI } from "app/utils/Paths";

const template = "penalty-details";

const navigation = {
    previous (): string {
        return ROOT_URI;
    },
    next (): string {
        return SELECT_THE_PENALTY_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

const sanitizeForm = (body: PenaltyIdentifier): PenaltyIdentifier => {

    return {
        companyNumber: sanitizeCompany(body.companyNumber),
        userInputPenaltyReference: body.userInputPenaltyReference.toUpperCase(),
        penaltyReference: body.userInputPenaltyReference.toUpperCase(),
        penaltyList: body.penaltyList
    };

};

@controller(PENALTY_DETAILS_PAGE_URI, SessionMiddleware, AuthMiddleware, CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class PenaltyDetailsController extends SafeNavigationBaseController<PenaltyIdentifier> {
    constructor (@inject(PenaltyDetailsValidator) penaltyDetailsValidator: PenaltyDetailsValidator) {
        super(
            template,
            navigation,
            penaltyDetailsValidator,
            sanitizeForm,
            [CompanyNameProcessor]
        );
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): Record<string, any> & PenaltyIdentifier {
        return appeal.penaltyIdentifier;
    }

    protected prepareSessionModelPriorSave (appeal: Appeal, value: any): Appeal {

        if (value.penaltyList.items.length === 1) {
            value.penaltyReference = value.penaltyList.items[0].id;
        }
        appeal.penaltyIdentifier = value;

        loggerInstance().debug(loggingMessage(appeal, PenaltyDetailsController.name));

        return appeal;
    }
}

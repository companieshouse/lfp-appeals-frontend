import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { controller } from "inversify-express-utils";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { FormValidator } from "app/controllers/validators/FormValidator";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { OtherReason } from "app/models/OtherReason";
import { schema as formSchema } from "app/models/OtherReason.schema";
import {
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    SIGNOUT_PAGE_URI
} from "app/utils/Paths";

const template = "other-reason";

const navigation = {
    previous (): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    next (): string {
        return EVIDENCE_QUESTION_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

@controller(OTHER_REASON_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware, CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class OtherReasonController extends SafeNavigationBaseController<OtherReason> {
    constructor () {
        super(template, navigation, new FormValidator(formSchema));
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        const otherReason = appeal.reasons?.other;
        const name = appeal.createdBy?.name;
        const relationshipToCompany = appeal.createdBy?.relationshipToCompany;

        return { ...otherReason, name, relationshipToCompany };
    }

    protected prepareSessionModelPriorSave (appeal: Appeal, value: any): Appeal {

        appeal.reasons.other!.title = value.title;
        appeal.reasons.other!.description = value.description;

        appeal.createdBy = {
            ...appeal.createdBy,
            name: value.name,
            relationshipToCompany: value.relationshipToCompany
        };

        loggerInstance().debug(loggingMessage(appeal, OtherReasonController.name));

        return appeal;
    }
}

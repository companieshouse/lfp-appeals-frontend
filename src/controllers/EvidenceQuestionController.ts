import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import Joi from "@hapi/joi";
import { Request } from "express";
import { controller } from "inversify-express-utils";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { NavigationPermissionProcessor } from "app/controllers/processors/NavigationPermissionProcessor";
import { FormValidator } from "app/controllers/validators/FormValidator";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { Appeal } from "app/models/Appeal";
import { Attachment } from "app/models/Attachment";
import { YesNo } from "app/models/fields/YesNo";
import { createSchema } from "app/models/fields/YesNo.schema";
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    FURTHER_INFORMATION_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    SIGNOUT_PAGE_URI
} from "app/utils/Paths";
import { getAttachmentsFromReasons, getReasonFromReasons, isIllnessReason } from "app/utils/appeal/extra.data";
import { Navigation } from "app/utils/navigation/navigation";

const template = "evidence-question";

const navigation: Navigation = {
    previous (request: Request): string {
        const isIllness = isIllnessReason(request.session);

        if (isIllness) {
            return FURTHER_INFORMATION_PAGE_URI;
        } else {
            return OTHER_REASON_PAGE_URI;
        }
    },
    next (request: Request): string {
        if (request.body.evidence === YesNo.yes) {
            return EVIDENCE_UPLOAD_PAGE_URI;
        } else {
            return CHECK_YOUR_APPEAL_PAGE_URI;
        }
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

const schema: Joi.AnySchema = Joi.object({
    _csrf: Joi.string().optional(),
    evidence: createSchema("You must tell us if you want to upload evidence.")
}).unknown(true);

@controller(EVIDENCE_QUESTION_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware, CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class EvidenceQuestionController extends SafeNavigationBaseController<Attachment> {
    constructor () {
        super(template, navigation, new FormValidator(schema), undefined, [NavigationPermissionProcessor]);
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        const attachments = getAttachmentsFromReasons(appeal.reasons);
        const evidenceUploded = attachments
            ? (attachments.length > 0) ? YesNo.yes : YesNo.no
            : undefined;
        return { evidenceUploded };
    }

    protected prepareSessionModelPriorSave (appeal: Appeal): Appeal {
        const reason = getReasonFromReasons(appeal.reasons);

        if (!reason!.attachments) {
            reason!.attachments = [];
        }

        return appeal;
    }
}

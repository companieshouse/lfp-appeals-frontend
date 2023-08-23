import { Penalty } from "@companieshouse/api-sdk-node/dist/services/lfp";
import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { Request } from "express";
import { controller } from "inversify-express-utils";
import { SafeNavigationBaseController } from "./SafeNavigationBaseController";

import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CheckForDuplicateMiddleware } from "app/middleware/CheckForDuplicateMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { Appeal } from "app/models/Appeal";
import {
    CHOOSE_REASON_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    REVIEW_PENALTY_PAGE_URI,
    SELECT_THE_PENALTY_PAGE_URI,
    SIGNOUT_PAGE_URI
} from "app/utils/Paths";
import { Navigation } from "app/utils/navigation/navigation";

const template = "review-penalty";

const navigation: Navigation = {
    previous (): string {
        return `${SELECT_THE_PENALTY_PAGE_URI}?back=true`;
    },
    next (request: Request): string {
        return (request.app.locals.featureFlags.illnessReasonEnabled)
            ? CHOOSE_REASON_PAGE_URI
            : OTHER_REASON_DISCLAIMER_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

@controller(REVIEW_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware,
    CheckForDuplicateMiddleware, CommonVariablesMiddleware)
export class ReviewPenaltyController extends SafeNavigationBaseController<Penalty> {

    public static PENALTY_EXPECTED_ERROR: string = "Penalty object expected but none found";
    public static PENALTY_IDENTIFIER_EXPECTED_ERROR: string = "User input penalty identifier expected";
    public static PENALTY_NOT_FOUND: string = "Penalty identifier did not match any item in list of penalties expected";

    constructor () {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal (appeal: Appeal): any {

        const penaltyList = appeal.penaltyIdentifier.penaltyList;

        if (!penaltyList) {
            throw new Error(ReviewPenaltyController.PENALTY_EXPECTED_ERROR);
        }

        const penaltyReference: string | undefined = appeal.penaltyIdentifier.penaltyReference;

        if (!penaltyReference) {
            throw new Error(ReviewPenaltyController.PENALTY_IDENTIFIER_EXPECTED_ERROR);
        }

        const penalty: Penalty | undefined = penaltyList.items.find(item => item.id === penaltyReference);

        if (!penalty) {
            throw new Error(ReviewPenaltyController.PENALTY_NOT_FOUND);
        }

        return { ...appeal.penaltyIdentifier, penalty };
    }
}

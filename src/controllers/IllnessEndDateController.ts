import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { controller } from "inversify-express-utils";
import moment from "moment";
import { IllnessEndDateValidator } from "./validators/IllnessEndDateValidator";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { FeatureToggleMiddleware } from "app/middleware/FeatureToggleMiddleware";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { Illness } from "app/models/Illness";
import { Reasons } from "app/models/Reasons";
import { Feature } from "app/utils/Feature";
import { CONTINUED_ILLNESS_PAGE_URI, FURTHER_INFORMATION_PAGE_URI, ILLNESS_END_DATE_PAGE_URI, SIGNOUT_PAGE_URI } from "app/utils/Paths";
import { Navigation } from "app/utils/navigation/navigation";

const template: string = "illness/illness-end-date";

const navigation: Navigation = {
    previous (): string {
        return CONTINUED_ILLNESS_PAGE_URI;
    },
    next (): string {
        return FURTHER_INFORMATION_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

interface FormBody {
    date: Date;
}

@controller(ILLNESS_END_DATE_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware,
    AuthMiddleware, CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class IllnessEndDateController extends SafeNavigationBaseController<FormBody> {

    constructor () {
        super(template, navigation, new IllnessEndDateValidator());
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        const illness: Illness | undefined = appeal.reasons?.illness;
        const illnessStart = appeal.reasons.illness?.illnessStart;

        if (!illness?.illnessEnd) {
            return { illnessStart };
        }

        const [year, month, day] = illness.illnessEnd.split("-", 3);

        return { day, month, year, illnessStart };
    }

    protected prepareSessionModelPriorSave (appeal: Appeal, value: FormBody): Appeal {
        const illness: Illness | undefined = appeal.reasons?.illness;

        if (illness != null) {
            illness.illnessEnd = moment(value.date).format("YYYY-MM-DD");
        } else {
            appeal.reasons = {
                illness: {
                    illnessEnd: moment(value.date).format("YYYY-MM-DD")
                }
            } as Reasons;
        }

        loggerInstance().debug(loggingMessage(appeal, IllnessEndDateController.name));

        return appeal;
    }
}

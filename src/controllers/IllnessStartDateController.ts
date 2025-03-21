import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { controller } from "inversify-express-utils";
import moment from "moment";

import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { DateValidator } from "app/controllers/validators/DateValidator";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { FeatureToggleMiddleware } from "app/middleware/FeatureToggleMiddleware";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { Illness } from "app/models/Illness";
import { Reasons } from "app/models/Reasons";
import { Feature } from "app/utils/Feature";
import { CONTINUED_ILLNESS_PAGE_URI, ILL_PERSON_PAGE_URI, ILLNESS_START_DATE_PAGE_URI, SIGNOUT_PAGE_URI } from "app/utils/Paths";
import { Navigation } from "app/utils/navigation/navigation";

const template: string = "illness/illness-start-date";

const navigation: Navigation = {
    previous (): string {
        return ILL_PERSON_PAGE_URI;
    },
    next (): string {
        return CONTINUED_ILLNESS_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    }
};

interface FormBody {
    date: Date;
}

@controller(ILLNESS_START_DATE_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware,
    AuthMiddleware, CommonVariablesMiddleware, CsrfProtectionMiddleware)
export class IllnessStartDateController extends SafeNavigationBaseController<FormBody> {

    constructor () {
        super(template, navigation, new DateValidator());
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        const illness: Illness | undefined = appeal.reasons?.illness;
        if (!illness?.illnessStart) {
            return {};
        }

        const [year, month, day] = illness.illnessStart.split("-", 3);

        return { day, month, year };
    }

    protected prepareSessionModelPriorSave (appeal: Appeal, value: FormBody): Appeal {
        const illness: Illness | undefined = appeal.reasons?.illness;

        if (illness != null) {
            illness.illnessStart = moment(value.date).format("YYYY-MM-DD");
        } else {
            appeal.reasons = {
                illness: {
                    illnessStart: moment(value.date).format("YYYY-MM-DD")
                }
            } as Reasons;
        }

        loggerInstance().debug(loggingMessage(appeal, IllnessStartDateController.name));

        return appeal;
    }
}

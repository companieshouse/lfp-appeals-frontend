import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { StartDateValidator } from 'app/controllers/validators/StartDateValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { Reasons } from 'app/models/Reasons';
import { Feature } from 'app/utils/Feature';
import { ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template: string = 'illness/illness-start-date';

const navigation: Navigation = {
    previous(): string {
        return ILLNESS_START_DATE_PAGE_URI;
    },
    next(): string {
        return ILLNESS_START_DATE_PAGE_URI;
    }
};

const applyPadding = (dayMonth: string): string => {
    return dayMonth.length < 2 ? dayMonth.padStart(2, '0') : dayMonth;
};

@controller(ILLNESS_START_DATE_PAGE_URI, SessionMiddleware, AuthMiddleware,
    FeatureToggleMiddleware(Feature.ILLNESS_REASON))
export class IllnessStartDateController extends BaseController<Illness> {

    constructor() {
        super(template, navigation, new StartDateValidator());
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const illness: Illness | undefined = appeal.reasons?.illness || undefined;
        if (!illness) {
            return {};
        }
        const startDate: Date = new Date(illness.illnessStart);
        const day: string = applyPadding(startDate.getDate().toString());
        const month: string = applyPadding((startDate.getMonth() + 1).toString());
        const year: string = startDate.getFullYear().toString();

        return {day, month, year};
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: Illness): Appeal {
        if (appeal.reasons?.illness != null) {
            appeal.reasons.illness = value;
        } else {
            appeal.reasons = {
                illness: value
            } as Reasons;
        }
        loggerInstance()
            .debug(`${IllnessStartDateController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}

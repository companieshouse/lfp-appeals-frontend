import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import moment from 'moment';
import { IllnessEndDateValidator } from './validators/IllnessEndDateValidator';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness} from 'app/models/Illness';
import { Reasons} from 'app/models/Reasons';
import { Feature } from 'app/utils/Feature';
import { CONTINUED_ILLNESS_PAGE_URI, FURTHER_INFORMATION_PAGE_URI, ILLNESS_END_DATE_PAGE_URI} from 'app/utils/Paths';
import { formatDate } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template: string = 'illness/illness-end-date';

const navigation: Navigation = {
    previous(): string {
        return CONTINUED_ILLNESS_PAGE_URI;
    },
    next(): string {
        return FURTHER_INFORMATION_PAGE_URI;
    }
};

interface FormBody {
    date: Date;
}

@controller(ILLNESS_END_DATE_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware,
    AuthMiddleware)
export class IllnessEndDateController extends SafeNavigationBaseController<FormBody> {

    constructor() {
        super(template, navigation, new IllnessEndDateValidator());
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const illness: Illness | undefined = appeal.reasons?.illness;
        const illnessStart = appeal.reasons.illness?.illnessStart || '';
        const illnessStartedOnDate = `You told us the illness started on ${formatDate(illnessStart)}`;
        if (!illness?.illnessEnd) {
            return {illnessStartedOnDate};
        }

        const [year, month, day] = illness.illnessEnd.split('-', 3);

        return {day, month, year, illnessStartedOnDate};
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: FormBody): Appeal {
        const illness: Illness | undefined = appeal.reasons?.illness;

        if (illness != null) {
            illness.illnessEnd = moment(value.date).format('YYYY-MM-DD');
        } else {
            appeal.reasons = {
                illness: {
                    illnessEnd: moment(value.date).format('YYYY-MM-DD')
                }
            } as Reasons;
        }

        loggerInstance().debug(loggingMessage(appeal, IllnessEndDateController.name));

        return appeal;
    }
}

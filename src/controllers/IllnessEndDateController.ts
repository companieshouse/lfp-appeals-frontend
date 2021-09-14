import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { DateValidator } from 'app/controllers/validators/DateValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { Appeal } from 'app/models/Appeal';
import { Feature } from 'app/utils/Feature';
import { CONTINUED_ILLNESS_PAGE_URI, FURTHER_INFORMATION_PAGE_URI, ILLNESS_END_DATE_PAGE_URI} from 'app/utils/Paths';
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
        super(template, navigation, new DateValidator());
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }

    protected prepareSessionModelPriorSave(appeal: Appeal): Appeal {
        return appeal;
    }
}

import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { StartDateValidator } from 'app/controllers/validators/StartDateValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
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

@controller(ILLNESS_START_DATE_PAGE_URI, SessionMiddleware, AuthMiddleware, IllnessReasonFeatureMiddleware)
export class IllnessStartDateController extends BaseController<any> {

    constructor() {
        super(template, navigation, new StartDateValidator());
    }
}

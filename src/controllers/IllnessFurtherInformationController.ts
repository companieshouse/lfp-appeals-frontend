import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { Feature } from 'app/utils/Feature';
import {
    EVIDENCE_QUESTION_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_START_DATE_PAGE_URI
} from 'app/utils/Paths';
import { addNavigationPermission } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';


const template = 'illness/illness-information';

const navigation: Navigation = {
    previous(): string {
        return ILLNESS_START_DATE_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_QUESTION_URI;
    },
};

@controller(FURTHER_INFORMATION_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON),
    SessionMiddleware, AuthMiddleware)
export class IllnessFurtherInformationController extends BaseController<Illness> {
    constructor() {
        super(
            template,
            navigation
        );
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {
        addNavigationPermission(this.httpContext.request.session, EVIDENCE_QUESTION_URI);

        loggerInstance().debug(`
            prepareSessionModelPriorSave: ${value?.description} -
            Penalty Id: ${JSON.stringify(appeal.penaltyIdentifier)}`);

        return appeal;
    }
}
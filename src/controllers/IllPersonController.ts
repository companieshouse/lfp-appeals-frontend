import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { FormValidator } from './validators/FormValidator';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { IllPerson } from 'app/models/fields/IllPerson';
import { schema } from 'app/models/fields/IllPerson.schema';
import { Feature } from 'app/utils/Feature';
import { CHOOSE_REASON_PAGE_URI, ILL_PERSON_PAGE_URI, ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'illness/ill-person';

const navigation : Navigation = {
    previous(): string {
        return CHOOSE_REASON_PAGE_URI;
    },
    next(): string {
        return ILLNESS_START_DATE_PAGE_URI;
    },
    actions: (_: boolean) => {
        return {
            continue:'action=continue'
        };
    }
};

interface FormBody {
    illPerson: IllPerson;
    otherPerson: string;
}

@controller(ILL_PERSON_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON),
    SessionMiddleware, AuthMiddleware)
export class IllPersonController extends SafeNavigationBaseController<FormBody> {

    constructor() {
        super(
            template,
            navigation,
            new FormValidator(schema)
        );
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const illness: Illness | undefined = appeal.reasons?.illness;

        if (!illness) {
            return {};
        }

        return {
            illPerson: illness.illPerson,
            otherPerson: illness.otherPerson
        };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: FormBody): Appeal {
        appeal.reasons.illness!.illPerson = value.illPerson;

        if (value.illPerson === IllPerson.someoneElse) {
            appeal.reasons.illness!.otherPerson = value.otherPerson;
        } else {
            appeal.reasons.illness!.otherPerson = undefined;
        }

        loggerInstance().debug(loggingMessage(appeal, IllPersonController.name));

        return appeal;
    }
}

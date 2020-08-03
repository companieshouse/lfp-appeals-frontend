// import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
// import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason.ts';
import { IllPerson } from 'app/models/fields/IllPerson';
import { Feature } from 'app/utils/Feature';
import { ILL_PERSON_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'illness/who-was-ill';

const navigation : Navigation = {
    previous(): string {
        return '';
    },
    next(): string {
        return '';
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
export class IllPersonController extends BaseController<FormBody> {

    constructor() {
        /* const errorMessage = 'You must tell us if this is a continued illness';
        const schema: Joi.AnySchema = Joi.object({
            continuedIllness: createSchema(errorMessage)
        }).unknown(true); */

        super(
            template,
            navigation,
            // new FormValidator(schema)
        );
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const illnessStart = appeal.reasons.illness?.illnessStart;

        return { illnessStart };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {

        const dummyOther: OtherReason = {
            title: 'Dummy Reason',
            description: 'The current Appeal data model requires an Other-type reason, ' +
                'and reworking the data model is outside of the scope of this feature. ' +
                'Until the Appeal object has been remodelled, this dummy reason must ' +
                'be included.'
        };

        if (appeal.reasons?.illness != null) {
            appeal.reasons.illness.illPerson = value.illPerson;
            if (value.illPerson !== IllPerson.otherPerson) {
                appeal.reasons.illness.otherPerson = undefined;
            }
        } else {
            appeal.reasons = {
                illness: value,
                other: dummyOther
            };
        }

        loggerInstance()
            .debug(`${IllPersonController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}

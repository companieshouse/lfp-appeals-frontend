import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { createSchema } from 'app/models/fields/YesNo.schema';
import { CONTINUED_ILLNESS_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'continued-illness';

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

@controller(CONTINUED_ILLNESS_PAGE_URI, IllnessReasonFeatureMiddleware, SessionMiddleware, AuthMiddleware)
export class ContinuedIllnessController extends BaseController<any> {

    constructor() {
        const errorMessage = 'You must tell us if this is a continued illness';
        const schema: Joi.AnySchema = Joi.object({
            continuedIllness: createSchema(errorMessage)
        }).unknown(true);

        super(
            template,
            navigation,
            new FormValidator(schema)
        );
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const illnessStartDateRaw = appeal.reasons.illness?.illnessStart;

        if (!illnessStartDateRaw) {
            throw new Error('Illness Start Date expected but not found');
        } else {
            const illnessStart = illnessStartDateRaw.toLocaleDateString('en-GB', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const hint: string = `You told us the illness started on ${illnessStart}`;
            return { hint };
        }
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: Illness): Appeal {
        if (appeal.reasons?.illness != null) {
            appeal.reasons.illness.continuedIllness = value.continuedIllness;
            if (value.continuedIllness === true) {
                appeal.reasons.illness.illnessEnd = undefined;
            }
        } else {
            throw new Error('Illness reason object expected but none found');
        }

        loggerInstance()
            .debug(`${ContinuedIllnessController.name} - prepareSessionModelPriorSave: ${JSON.stringify(appeal)}`);
        return appeal;
    }
}
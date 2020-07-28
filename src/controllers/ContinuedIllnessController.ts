import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
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
        /* What follows is dummy data for the Other object.
           This is necessary for the time being, in order to adhere to the scope
           of the ticket. The Appeal data object will be updated in a later ticket
           and this function will then be reworked.
        */
        const dummyOtherReason: OtherReason = {
            title: 'Dummy Data',
            description: 'Other Reason remains compulsory for the time being.'
        };

        if (appeal.reasons?.illness != null) {
            appeal.reasons.illness.continuedIllness = value.continuedIllness;
            if (value.continuedIllness === true) {
                appeal.reasons.illness.illnessEnd = undefined;
            }
        } else {
            appeal.reasons = {
                other: dummyOtherReason,
                illness: value
            };
        }

        return appeal;
    }
}
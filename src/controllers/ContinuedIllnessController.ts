import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';
import { FormValidator } from './validators/FormValidator';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import { Feature } from 'app/utils/Feature';
import {
    CONTINUED_ILLNESS_PAGE_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_END_DATE_PAGE_URI,
    ILLNESS_START_DATE_PAGE_URI
} from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'illness/continued-illness';

const navigation : Navigation = {
    previous(): string {
        return ILLNESS_START_DATE_PAGE_URI;
    },
    next(request: Request): string {
        if(request.body.continuedIllness === YesNo.yes) {
            return FURTHER_INFORMATION_PAGE_URI;
        } else {
            return ILLNESS_END_DATE_PAGE_URI;
        }
    }
};

interface FormBody {
    continuedIllness: YesNo;
    illnessStart: string;
}

@controller(CONTINUED_ILLNESS_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON),
    SessionMiddleware, AuthMiddleware)
export class ContinuedIllnessController extends SafeNavigationBaseController<FormBody> {

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
        const illnessStart = appeal.reasons.illness?.illnessStart;

        return { illnessStart };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: FormBody): Appeal {
        if (appeal.reasons?.illness != null) {
            const continuedIllness = value.continuedIllness === YesNo.yes;
            appeal.reasons.illness.continuedIllness = continuedIllness;
            if (continuedIllness) {
                appeal.reasons.illness.illnessEnd = undefined;
            }
        } else {
            throw new Error('Illness reason object expected but none found');
        }

        loggerInstance().debug(loggingMessage(appeal, ContinuedIllnessController.name));

        return appeal;
    }
}

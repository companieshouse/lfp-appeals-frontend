import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
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
}
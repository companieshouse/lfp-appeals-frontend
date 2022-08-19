import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import {
    ACCOUNTS_SIGNOUT_URI,
    ENTRY_PAGE_URI,
    SIGNOUT_PAGE_URI
} from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'signout';

const navigation: Navigation = {
    previous(): string {
        return ENTRY_PAGE_URI;
    },
     next(request: Request): string {
        if (request.body.signingOut === YesNo.yes) {
            return ACCOUNTS_SIGNOUT_URI;
            } else {
                return ENTRY_PAGE_URI;
        }
     }
};

interface FormBody {
    signingOut: YesNo;
}

@controller(SIGNOUT_PAGE_URI,
    SessionMiddleware, AuthMiddleware)
export class SignOutController extends SafeNavigationBaseController<FormBody>{

    constructor() {
           const errorMessage = 'Select yes if you want to sign out.';
           const schema: Joi.AnySchema = Joi.object({
               signingOut: createSchema(errorMessage)
           }).unknown(true);

           super(
               template,
               navigation,
               new FormValidator(schema)
           );
       }
}

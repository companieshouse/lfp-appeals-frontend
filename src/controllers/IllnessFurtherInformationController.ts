import { SessionMiddleware } from '@companieshouse/node-session-handler';
import Joi from '@hapi/joi';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';
import { FormValidator } from './validators/FormValidator';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CommonVariablesMiddleware } from 'app/middleware/CommonVariablesMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { Feature } from 'app/utils/Feature';
import {
    CONTINUED_ILLNESS_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_END_DATE_PAGE_URI,
    SIGNOUT_PAGE_URI
} from 'app/utils/Paths';
import { checkContinuedIllness } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'illness/illness-information';

const navigation: Navigation = {
    previous(request: Request): string {
        const continuedIllness = checkContinuedIllness(request.session);

        if (continuedIllness) {
            return CONTINUED_ILLNESS_PAGE_URI;
        } else {
            return ILLNESS_END_DATE_PAGE_URI;
        }
    },
    next(): string {
        return EVIDENCE_QUESTION_URI;
    },
     signOut(): string{
        return SIGNOUT_PAGE_URI;
     }
};

const nameErrorMessage = 'Enter your name';
const descriptionErrorMessage = 'You must tell us how this affected your ability to file on time';
const furtherInformationSchema = Joi.object({
    name: Joi.string().required().pattern(/\w+/).messages({
        'any.required': nameErrorMessage,
        'string.empty': nameErrorMessage,
        'string.pattern.base': nameErrorMessage
    }),
    description: Joi.string().required().pattern(/\w+/).messages({
        'any.required': descriptionErrorMessage,
        'string.empty': descriptionErrorMessage,
        'string.pattern.base': descriptionErrorMessage
    })
});

@controller(FURTHER_INFORMATION_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON),
    SessionMiddleware, AuthMiddleware, CommonVariablesMiddleware)
export class IllnessFurtherInformationController extends SafeNavigationBaseController<Illness> {
    constructor() {
        super(
            template,
            navigation,
            new FormValidator(furtherInformationSchema)
        );
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const description = appeal.reasons.illness?.illnessImpactFurtherInformation;
        const name = appeal.createdBy?.name;

        loggerInstance().debug(loggingMessage(appeal, IllnessFurtherInformationController.name));

        return { name, description };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {

        appeal.reasons.illness!.illnessImpactFurtherInformation = value.description;
        appeal.createdBy = {
            ...appeal.createdBy,
            name: value.name
        };

        loggerInstance().debug(loggingMessage(appeal, IllnessFurtherInformationController.name));

        return appeal;
    }
}

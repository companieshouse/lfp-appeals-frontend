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
import { Illness } from 'app/models/Illness';
import { Feature } from 'app/utils/Feature';
import {
    CONTINUED_ILLNESS_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    FURTHER_INFORMATION_PAGE_URI,
    ILLNESS_END_DATE_PAGE_URI
} from 'app/utils/Paths';
import { getIllnessEndDate } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'illness/illness-information';

const navigation: Navigation = {
    previous(request: Request): string {
        const illnessEndDate = getIllnessEndDate(request.session);

        if (illnessEndDate) {
            return ILLNESS_END_DATE_PAGE_URI;
        } else {
            return CONTINUED_ILLNESS_PAGE_URI;
        }
    },
    next(): string {
        return EVIDENCE_QUESTION_URI;
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
    SessionMiddleware, AuthMiddleware)
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
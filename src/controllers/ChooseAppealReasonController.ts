import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { loggerInstance, loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
import { schema } from 'app/models/fields/Reason.schema';
import { ReasonType } from 'app/models/fields/ReasonType';
import { Feature } from 'app/utils/Feature';
import {
    CHOOSE_REASON_PAGE_URI,
    ILL_PERSON_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    REVIEW_PENALTY_PAGE_URI
} from 'app/utils/Paths';
import { getAttachmentsFromReasons, getReasonType } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'choose-appeal-reason';

const navigation: Navigation = {
    previous(): string {
        return REVIEW_PENALTY_PAGE_URI;
    },
    next(request: Request): string {
        switch (request.body.reason) {
            case ReasonType.illness:
                return ILL_PERSON_PAGE_URI;
            default:
                return OTHER_REASON_DISCLAIMER_PAGE_URI;
        }
    },
    actions: (_: boolean) => {
        return {
            continue:'action=continue'
        };
    }
};

interface FormBody {
    reason: ReasonType;
}

@controller(CHOOSE_REASON_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware, AuthMiddleware,
CompanyAuthMiddleware)
export class ChooseAppealReasonController extends SafeNavigationBaseController<FormBody>{

    constructor() {
        super(template, navigation, new FormValidator(schema));
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        const reasonType = appeal.reasons ? getReasonType(appeal.reasons) : undefined;

        return { reasonType };
    }

    protected prepareSessionModelPriorSave(appeal: Appeal, value: any): Appeal {
        const attachments = getAttachmentsFromReasons(appeal.reasons);

        if(value.reason === ReasonType.illness) {
            appeal.reasons = {
                illness: {} as Illness
            };
            if(attachments) {
                appeal.reasons.illness.attachments = [ ...attachments ];
            }
        } else {
            appeal.reasons = {
                other: {} as OtherReason
            };
            if(attachments) {
                appeal.reasons.other.attachments = [ ...attachments ];
            }
        }

        loggerInstance().debug(loggingMessage(appeal, ChooseAppealReasonController.name));

        return appeal;
    }
}

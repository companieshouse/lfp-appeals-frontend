import Joi from '@hapi/joi';
import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import { FormActionProcessor } from './processors/FormActionProcessor';

import { RequestWithNavigation, SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    FURTHER_INFORMATION_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { isIllnessReason } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'evidence-question';

const navigation: Navigation = {
    previous(request: Request): string {
        const isIllness = isIllnessReason(request.session);

        if (isIllness) {
            return FURTHER_INFORMATION_PAGE_URI;
        } else {
            return OTHER_REASON_PAGE_URI;
        }
    },
    next(request: Request): string {
        if (request.body.evidence === YesNo.yes) {
            return EVIDENCE_UPLOAD_PAGE_URI;
        } else {
            return CHECK_YOUR_APPEAL_PAGE_URI;
        }
    }
};

const schema: Joi.AnySchema = Joi.object({
    evidence: createSchema('You must tell us if you want to upload evidence.')
}).unknown(true);

@provide(NavigationPermissionProcessor)
class NavigationPermissionProcessor implements FormActionProcessor {
    process(request: RequestWithNavigation): void {
        const session: Session | undefined = request.session;

        if (!session) {
            throw new Error('Session was expected but none found');
        }

        let applicationData: ApplicationData | undefined = session?.getExtraData(APPLICATION_DATA_KEY);

        if (!applicationData) {
            applicationData = {
                navigation: {
                    permissions: [ EVIDENCE_UPLOAD_PAGE_URI ]
                }
            } as ApplicationData;

            session!.setExtraData(APPLICATION_DATA_KEY, applicationData);
        } else {
            applicationData.navigation!.permissions.push(EVIDENCE_UPLOAD_PAGE_URI);
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(EVIDENCE_QUESTION_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class EvidenceQuestionController extends SafeNavigationBaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema), undefined, [NavigationPermissionProcessor]);
    }
}

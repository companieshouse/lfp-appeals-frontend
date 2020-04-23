import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { Navigation, NavigationControl } from 'app/utils/navigation/navigation';

const template = 'evidence-question';

const navigation: Navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(request: Request): string {
        if (request.body.evidence === YesNo.yes) {
            return EVIDENCE_UPLOAD_PAGE_URI;
        } else {
            return CHECK_YOUR_APPEAL_PAGE_URI;
        }
    }
};

const changeModeAction = (req: Request, step: keyof NavigationControl) => {
    if (step === 'next') {
        return EVIDENCE_UPLOAD_PAGE_URI + '?cm=1';
    }
    return navigation.next(req);
};

const schema: Joi.AnySchema = Joi.object({
    evidence: createSchema('You must tell us if you want to upload evidence.')
}).unknown(true);

@controller(EVIDENCE_QUESTION_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceQuestionController extends SafeNavigationBaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema), undefined, undefined, changeModeAction);
    }
}

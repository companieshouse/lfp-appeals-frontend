import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Attachment } from 'app/models/Attachment';
import { createSchema } from 'app/models/fields/YesNo.schema';
import {
    EVIDENCE_QUESTION_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'evidence-question';

const navigation: Navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_QUESTION_URI;
    }
};

const schema: Joi.AnySchema = Joi.object({
    evidence: createSchema('You must tell us if you want to upload evidence.')
}).unknown(true);

@controller(EVIDENCE_QUESTION_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceQuestionController extends BaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema));
    }
}

import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import { FormActionProcessor } from './processors/FormActionProcessor';

import { RequestWithNavigation, SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

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

const schema: Joi.AnySchema = Joi.object({
    evidence: createSchema('You must tell us if you want to upload evidence.')
}).unknown(true);

@provide(Processor)
class Processor implements FormActionProcessor {
    process(request: RequestWithNavigation): void {
        const session = request.session.unsafeCoerce();
        const applicationData: ApplicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .orDefaultLazy(() => {
                const value = {} as ApplicationData;
                session.saveExtraData(APPLICATION_DATA_KEY, value);
                return value;
            });

        applicationData?.navigation?.permissions.push(EVIDENCE_UPLOAD_PAGE_URI);
    }
}
// tslint:disable-next-line: max-classes-per-file
@controller(EVIDENCE_QUESTION_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceQuestionController extends SafeNavigationBaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema), undefined, [Processor]);
    }
}

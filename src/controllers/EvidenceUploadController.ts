import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { EvidenceUploadFormSubmissionProcessor }
    from 'app/controllers/processors/EvidenceUploadFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { OtherReason } from 'app/models/OtherReason';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';


const template = 'evidence-upload';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    }
};

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class EvidenceUploadController extends BaseController<OtherReason> {
    constructor() {
        super(template, navigation, undefined, undefined,
            [EvidenceUploadFormSubmissionProcessor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }
}

import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { ActionHandler, BaseController, ExtraActionHandlers } from 'app/controllers/BaseController';
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

@provide(FileUploadActionHandler)
class FileUploadActionHandler implements ActionHandler {
    // tslint:disable-next-line: max-line-length
    constructor(@inject(EvidenceUploadFormSubmissionProcessor) private readonly processor: EvidenceUploadFormSubmissionProcessor) {}

    async handle(request: Request, response: Response): Promise<void> {
        await this.processor.process(request);
        response.redirect(request.url);
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class EvidenceUploadController extends BaseController<OtherReason> {
    constructor() {
        super(template, navigation, undefined);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }

    protected getExtraActionHandlers(): ExtraActionHandlers {
        return {
            'upload-file': FileUploadActionHandler
        };
    }
}

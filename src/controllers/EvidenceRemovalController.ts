import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { EVIDENCE_REMOVAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

const template = 'evidence-removal';

const navigation = {
    previous(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    },
    next(request: Request): string {
        return `${EVIDENCE_REMOVAL_PAGE_URI}?f=${request.query.f}`;
    }
};

@controller(EVIDENCE_REMOVAL_PAGE_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceRemovalController extends BaseController<any> {
    constructor() {
        super(template, navigation);
    }

    protected prepareViewModel(): any {
        const fileId = this.httpContext.request.query.f;
        return { fileId, fileName: fileId };
    }
}

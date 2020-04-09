import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { EVIDENCE_REMOVAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'evidence-removal';

const navigation: Navigation = {
    previous(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    }
};

const schema: Joi.AnySchema = Joi.object({
    remove: createSchema('You must tell us if you want to remove the document')
}).unknown(true);

const findAttachment = (appeal: Appeal, fileId: string | undefined): Attachment => {
    if (fileId == null || fileId.trim().length < 1) {
        throw new Error('File identifier is missing');
    }
    const attachment = appeal.reasons.other?.attachments?.find(file => file.id === fileId);
    if (attachment == null) {
        throw new Error(`File ${fileId} does not belong to appeal`);
    }
    return attachment
};

/**
 * Processor that conditionally (if consent is given) removes file from:
 * - remote storage used by File Transfer API
 * - list of attachments stored in session
 */
@provide(Processor)
class Processor implements FormActionProcessor {
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {}

    async process(request: Request): Promise<void> {
        if (request.body.remove !== YesNo.yes) {
            return;
        }

        const appeal: Appeal = request.session
            .chain(session => session.getExtraData())
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .map(applicationData => applicationData.appeal)
            .unsafeCoerce();

        const attachment: Attachment = findAttachment(appeal, request.body.id);
        await this.fileTransferService.delete(attachment.id);
        appeal.reasons.other.attachments!.splice(appeal.reasons.other.attachments!.indexOf(attachment), 1)
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(EVIDENCE_REMOVAL_PAGE_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceRemovalController extends BaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema), undefined, [Processor]);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Attachment {
        return findAttachment(appeal, this.httpContext.request.query.f as string | undefined);
    }
}

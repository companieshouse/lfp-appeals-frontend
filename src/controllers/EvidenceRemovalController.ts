import Joi from '@hapi/joi';
import { SessionMiddleware } from 'ch-node-session-handler';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { YesNo } from 'app/models/fields/YesNo';
import { createSchema } from 'app/models/fields/YesNo.schema';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { EVIDENCE_REMOVAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI, SIGNOUT_PAGE_URI } from 'app/utils/Paths';
import { findAttachmentByIdFromReasons, removeAttachmentFromReasons } from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'evidence-removal';

const navigation: Navigation = {
    previous(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    },
     signOut(): string{
        return SIGNOUT_PAGE_URI;
     },
    actions: (changeMode: boolean) => {
        return {
            noAction: changeMode ? '&cm=1' : ''
        };
    }
};

const changeModeAction = () => EVIDENCE_UPLOAD_PAGE_URI + '?cm=1';

const schema: Joi.AnySchema = Joi.object({
    remove: createSchema('You must tell us if you want to remove the document')
}).unknown(true);

const findAttachment = (appeal: Appeal, fileId: string | undefined): Attachment => {
    if (fileId == null || fileId.trim().length < 1) {
        throw new Error('File identifier is missing');
    }

    const attachment = findAttachmentByIdFromReasons(appeal.reasons, fileId);

    if (!attachment) {
        throw new Error(`File ${fileId} does not belong to appeal`);
    }

    return attachment;
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

        const applicationData: ApplicationData | undefined = request.session!.getExtraData(APPLICATION_DATA_KEY);

        const appeal: Appeal = applicationData!.appeal;

        if (!appeal){
            throw new Error('Appeal was expected in session but none found');
        }

        const attachment: Attachment = findAttachment(appeal, request.body.id);

        await this.fileTransferService.delete(attachment.id);

        removeAttachmentFromReasons(appeal.reasons, attachment);
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(EVIDENCE_REMOVAL_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class EvidenceRemovalController extends BaseController<Attachment> {
    constructor() {
        super(template, navigation, new FormValidator(schema), undefined,
            [Processor], changeModeAction);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Attachment {
        return findAttachment(appeal, this.httpContext.request.query.f as string | undefined);
    }
}

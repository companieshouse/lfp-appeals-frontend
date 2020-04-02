import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { ActionHandler, ActionHandlerConstructor, BaseController } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { OtherReason } from 'app/models/OtherReason';
import { FileTransferService } from 'app/service/FileTransferService';
import { getEnv } from 'app/utils/EnvironmentUtils';
import { parseFormData } from 'app/utils/MultipartFormDataParser';
import { CHECK_YOUR_APPEAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

const template = 'evidence-upload';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        if (getEnv('FILE_TRANSFER_FEATURE') === '1') {
            return EVIDENCE_UPLOAD_PAGE_URI;
        }
        return CHECK_YOUR_APPEAL_PAGE_URI;
    }
};

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceUploadController extends BaseController<OtherReason> {
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super(template, navigation);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }

    protected getExtraActionHandlers(): Record<string, ActionHandler | ActionHandlerConstructor> {
        const that = this;
        return {
            'upload-file': {
                async handle(request: Request, response: Response): Promise<void> {

                    await parseFormData(request, response);

                    if(!request.file) response.redirect(request.url);

                    const id = await that.fileTransferService.upload(request.file.buffer, request.file.originalname);

                    const appeal: Appeal = request.session
                        .chain(_ => _.getExtraData())
                        .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
                        .map(data => data.appeal)
                        .unsafeCoerce();

                    appeal.reasons.other.attachments = [...appeal.reasons.other.attachments || [], {
                        id, name: request.file.originalname, contentType: request.file.mimetype, size: request.file.size
                    }];

                    await that.persistSession();

                    response.redirect(request.route.path);
                }
            }
        };
    }
}

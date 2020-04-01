import { SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import multer from 'multer';
import util from 'util';

import { ActionHandler, BaseController, ExtraActionHandlers } from 'app/controllers/BaseController';
import { UpdateSessionFormSubmissionProcessor } from 'app/controllers/processors/UpdateSessionFormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { OtherReason } from 'app/models/OtherReason';
import { FileTransferService } from 'app/service/FileTransferService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { CHECK_YOUR_APPEAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

const template = 'evidence-upload';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    }
};

@provide(Processor)
class Processor extends UpdateSessionFormSubmissionProcessor<any> {
    constructor(@inject(SessionStore) sessionStore: SessionStore) {
        super(sessionStore);
    }

    protected prepareModelPriorSessionSave(appeal: Appeal): Appeal {
        return appeal;
    }
}

// tslint:disable-next-line: max-classes-per-file
@provide(FileUploadActionHandler)
class FileUploadActionHandler implements ActionHandler {
    private readonly upload: any;

    // tslint:disable-next-line: max-line-length
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService,
                @inject(Processor) private readonly processor: Processor) {
        this.upload = util.promisify(
            multer({
                limits: {
                    fileSize: parseInt(getEnvOrThrow('MAX_FILE_SIZE_BYTES'), 10) // TODO: move out of constructor
                }
            }).single('file')
        );
    }

    async handle(request: Request, response: Response): Promise<void> {
        try {
            await this.upload(request, response);
        } catch (e) {
            console.log('error', e);
        }

        const id = await this.fileTransferService.upload(request.file.buffer, request.file.originalname);

        const appeal: Appeal = request.session
            .chain(_ => _.getExtraData())
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .map(data => data.appeal)
            .unsafeCoerce();

        appeal.reasons.other.attachments = [...appeal.reasons.other.attachments || [], {
            id, name: request.file.originalname, contentType: request.file.mimetype, size: request.file.size
        }];

        await this.processor.process(request, response);

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

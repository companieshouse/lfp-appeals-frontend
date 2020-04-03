import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { BaseController, FormActionHandler, FormActionHandlerConstructor } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { OtherReason } from 'app/models/OtherReason';
import { FileTransferService } from 'app/service/FileTransferService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { parseFormData } from 'app/utils/MultipartFormDataParser';
import { EVIDENCE_UPLOAD_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';

const template = 'evidence-upload';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
    }
};

const maxFileSize: number = Number(getEnvOrThrow(`MAX_FILE_SIZE_BYTES`));
const supportedFileTypes: string [] =
    ['text/plain', 'application/msword', 'application/pdf', 'image/jpeg', 'image/png'];

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceUploadController extends BaseController<OtherReason> {
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super(template, navigation);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return appeal.reasons?.other;
    }

    protected getExtraActionHandlers(): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        const that = this;
        return {
            'upload-file': {
                async handle(request: Request, response: Response): Promise<void> {

                    await parseFormData(request, response);

                    if (!request.file) {
                        response.redirect(request.route.path);
                        return;
                    } else if (request.file.buffer.byteLength > maxFileSize){
                        console.error('byteLength too long: ',request.file.buffer.byteLength);
                        // Render Page with error
                        return
                    } else if (!supportedFileTypes.includes(request.file.mimetype)){
                        console.error('filetype not supported: ',request.file.mimetype);
                        // Render Page with error
                        return
                    }

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

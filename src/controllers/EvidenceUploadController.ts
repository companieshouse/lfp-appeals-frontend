import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { MOVED_TEMPORARILY, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { BaseController, FormActionHandler, FormActionHandlerConstructor } from 'app/controllers/BaseController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { OtherReason } from 'app/models/OtherReason';
import { FileTransferService } from 'app/service/FileTransferService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { parseFormData } from 'app/utils/MultipartFormDataParser';
import { EVIDENCE_UPLOAD_PAGE_URI, OTHER_REASON_PAGE_URI } from 'app/utils/Paths';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const template = 'evidence-upload';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return EVIDENCE_UPLOAD_PAGE_URI;
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

    private async renderUploadError(appeal: Appeal, text: string): Promise<void> {
        const that = this;
        const validationResult: ValidationResult = new ValidationResult([
            new ValidationError('file', text)
        ]);

        return await that.renderWithStatus(UNPROCESSABLE_ENTITY)(
            that.template, {
                ...this.prepareViewModelFromAppeal(appeal),
                ...this.httpContext.request.body,
                validationResult
            }
        );
    }

    protected getExtraActionHandlers(): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        const that = this;
        return {
            'upload-file': {
                async handle(request: Request, response: Response): Promise<void> {

                    const maxNumberOfFiles: number = Number(getEnvOrThrow('MAX_NUMBER_OF_FILES'));

                    const appeal: Appeal = request.session
                        .chain(_ => _.getExtraData())
                        .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
                        .map(data => data.appeal)
                        .unsafeCoerce();

                    try {
                        await parseFormData(request, response)
                    } catch (error) {
                        if (error.message === 'File not supported') {
                            return await that
                                .renderUploadError(appeal, 'The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                        } else if (error.message === 'File too large') {
                            return await that
                                .renderUploadError(appeal, 'File size must be smaller than 4MB');
                        }
                    }

                    if (!request.file) {
                        response.redirect(MOVED_TEMPORARILY, request.route.path);
                        return;
                    } else if (appeal.reasons.other.attachments &&
                        appeal.reasons.other.attachments!.length >= maxNumberOfFiles) {
                        return await that
                            .renderUploadError(appeal, 'You can only select up to 10 files at the same time');
                    }

                    let id: string;

                    try {
                        id = await that.fileTransferService.upload(request.file.buffer, request.file.originalname);
                    } catch (err) {
                        if (err.message === 'Request failed with status code 415') {
                            return await that
                                .renderUploadError(appeal, 'The selected file must be a TXT, DOC, PDF, JPEG or PNG');
                        } else {
                            throw new Error(err.message)
                        }
                    }

                    appeal.reasons.other.attachments = [...appeal.reasons.other.attachments || [], {
                        id, name: request.file.originalname, contentType: request.file.mimetype, size: request.file.size
                    }];

                    await that.persistSession();

                    response.redirect(request.route.path);
                }
            },
            'upload-file-continue': {
                async handle(request: Request, response: Response): Promise<void> {

                    const appeal: Appeal = request.session
                        .chain(_ => _.getExtraData())
                        .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
                        .map(data => data.appeal)
                        .unsafeCoerce();

                    const attachments: Attachment[] | undefined = appeal.reasons.other.attachments;

                    if (!attachments || attachments.length === 0) {
                        return await that.renderUploadError(appeal, 'You must add a document or click ' +
                            '“Continue without adding documents”');
                    }
                    response.redirect(request.route.path);
                }
            }
        };
    }
}

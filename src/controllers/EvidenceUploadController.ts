import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { FormActionHandler, FormActionHandlerConstructor } from 'app/controllers/BaseController';
import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { Validator } from 'app/controllers/validators/Validator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { UnsupportedFileTypeError } from 'app/modules/file-transfer-service/errors';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { parseFormData } from 'app/utils/MultipartFormDataParser';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    DOWNLOAD_FILE_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_REMOVAL_PAGE_URI,
    EVIDENCE_UPLOAD_PAGE_URI
} from 'app/utils/Paths';
import { newUriFactory } from 'app/utils/UriFactory';
import {
    addAttachmentToReason,
    getAttachmentsFromReasons,
    getReasonFromReasons
} from 'app/utils/appeal/extra.data';
import { Navigation } from 'app/utils/navigation/navigation';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const maxNumberOfFiles: number = Number(getEnvOrThrow('MAX_NUMBER_OF_FILES'));

const template = 'evidence-upload';

const navigation: Navigation = {
    previous(): string {
        return EVIDENCE_QUESTION_URI;
    },
    next(): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    },
    actions: (changeMode: boolean) => {
        return {
            noAction: changeMode ? '?cm=1' : '?cm=0',
            uploadFile: changeMode ? '?action=upload-file&cm=1' : '?action=upload-file',
            removeFile: changeMode ? `${EVIDENCE_REMOVAL_PAGE_URI}?cm=1&` : `${EVIDENCE_REMOVAL_PAGE_URI}?`
        };
    }
};

const continueButtonValidator: Validator = {

    async validate(request: Request): Promise<ValidationResult> {

        const applicationData: ApplicationData = request.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData.appeal;

        if (!appeal){
            throw new Error('Appeal is undefined');
        }

        const attachments: Attachment[] | undefined = getAttachmentsFromReasons(appeal.reasons);

        if (!attachments || attachments.length === 0) {
            return new ValidationResult([new ValidationError('file',
                'You must upload a document or click \"Continue without uploading documents\"')]);
        }

        return new ValidationResult([]);
    }
};

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware)
export class EvidenceUploadController extends SafeNavigationBaseController<any> {
    // the uploading happens through the FileTransferService class (upload method)
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super(template, navigation, continueButtonValidator, undefined, undefined);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        // does not get attachments from session data or return them
        return {
            ...getReasonFromReasons(appeal.reasons),
            companyNumber: appeal.penaltyIdentifier?.companyNumber
        };
    }

    private async renderUploadError(appeal: Appeal, text: string): Promise<void> {
        const validationResult: ValidationResult = new ValidationResult([
            new ValidationError('file', text)
        ]);

        return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
            this.template,
            {
                ...this.prepareViewModelFromAppeal(appeal),
                ...this.httpContext.request.body,
                ...this.prepareNavigationConfig(),
                validationResult,
            }
        );
    }

    // this method is called by the POST in the SafeNavigationBaseController class
    protected getExtraActionHandlers(): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        const that = this;

        const noFileSelectedError: string = 'Select a document to add to your application';
        const fileTooLargeError: string = 'File size must be smaller than 4MB';
        const fileNotSupportedError: string = 'The selected file must be a DOCX, XLSX, PDF, JPEG, PNG or GIF';
        const tooManyFilesError: string = `You can only select up to ${maxNumberOfFiles} files at the same time`;

        return {
            'upload-file': {
                async handle(request: Request, response: Response): Promise<void> {

                    const applicationData: ApplicationData = request.session!
                        .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

                    const appeal: Appeal = applicationData.appeal;

                    if (!appeal){
                        throw new Error('Appeal was expected in session but none found');
                    }

                    try {
                        await parseFormData(request, response);
                    } catch (error) {
                        switch (error.code) {
                            case 'LIMIT_FILE_SIZE':
                                return await that.renderUploadError(appeal, fileTooLargeError);
                            case 'LIMIT_UNEXPECTED_FILE':
                                return await that.renderUploadError(appeal, fileNotSupportedError);
                        }
                    }

                    // gets the attachments from the extra data of reasons
                    const attachments = getAttachmentsFromReasons(appeal.reasons);

                    // shows errors if there is no file or too many files choses to be uploaded.
                    if (!request.file) {
                        return await that.renderUploadError(appeal, noFileSelectedError);
                    } else if (attachments && attachments.length >= maxNumberOfFiles) {
                        return await that.renderUploadError(appeal, tooManyFilesError);
                    }

                    let id: string;

                    // gets the chosen file's ID from the FileTransferService
                    try {
                        id = await that.fileTransferService.upload(request.file.buffer, request.file.originalname);
                    } catch (err) {
                        if (err instanceof UnsupportedFileTypeError) {
                            return await that.renderUploadError(appeal, fileNotSupportedError);
                        } else {
                            throw err;
                        }
                    }

                    const downloadBaseURI: string = newUriFactory(request)
                        .createAbsoluteUri(DOWNLOAD_FILE_PAGE_URI);

                    addAttachmentToReason(appeal.reasons, {
                        id,
                        name: request.file.originalname,
                        contentType: request.file.mimetype,
                        size: request.file.size,
                        url: `${downloadBaseURI}/prompt/${id}?c=${appeal.penaltyIdentifier.companyNumber}`
                    });

                    await that.persistSession();

                    if (request.query.cm === '1') {
                        return response.redirect(request.route.path + '?cm=1');
                    }

                    response.redirect(request.route.path);
                }
            }
        };
    }
}

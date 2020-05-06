import { SessionMiddleware } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { inject } from 'inversify';
import { controller } from 'inversify-express-utils';

import { FormActionHandler, FormActionHandlerConstructor } from 'app/controllers/BaseController';
import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { Validator } from 'app/controllers/validators/Validator';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { OtherReason } from 'app/models/OtherReason';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { UnsupportedFileTypeError } from 'app/modules/file-transfer-service/errors';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { parseFormData } from 'app/utils/MultipartFormDataParser';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_REMOVAL_PAGE_URI,
    EVIDENCE_UPLOAD_PAGE_URI
} from 'app/utils/Paths';
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
            continueWithoutUpload: '?action=continue-without-upload',
            removeFile: changeMode ? `${EVIDENCE_REMOVAL_PAGE_URI}?cm=1&` : `${EVIDENCE_REMOVAL_PAGE_URI}?`
        };
    }
};

const continueButtonValidator: Validator = {

    validate(request: Request): ValidationResult {

        const applicationData: ApplicationData = request.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData!.appeal;

        const attachments: Attachment[] | undefined = appeal.reasons.other.attachments;

        if (!attachments || attachments.length === 0) {
            return new ValidationResult([new ValidationError('file',
                'You must add a document or click \"Continue without adding documents\"')]);
        }
        return new ValidationResult([]);
    }
};

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware, FileTransferFeatureMiddleware)
export class EvidenceUploadController extends SafeNavigationBaseController<OtherReason> {
    constructor(@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super(template, navigation, continueButtonValidator, undefined, undefined);
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & OtherReason {
        return { ...appeal.reasons?.other, companyNumber: appeal.penaltyIdentifier?.companyNumber };
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
                validationResult
            }
        );
    }

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

                    const appeal: Appeal = applicationData!.appeal;

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

                    if (!request.file) {
                        return await that.renderUploadError(appeal, noFileSelectedError);
                    } else if (appeal.reasons.other.attachments &&
                        appeal.reasons.other.attachments.length >= maxNumberOfFiles) {
                        return await that.renderUploadError(appeal, tooManyFilesError);
                    }

                    let id: string;

                    try {
                        id = await that.fileTransferService.upload(request.file.buffer, request.file.originalname);
                    } catch (err) {
                        if (err instanceof UnsupportedFileTypeError) {
                            return await that.renderUploadError(appeal, fileNotSupportedError);
                        } else {
                            throw err;
                        }
                    }

                    appeal.reasons.other.attachments = [...appeal.reasons.other.attachments || [], {
                        id, name: request.file.originalname, contentType: request.file.mimetype, size: request.file.size
                    }];

                    await that.persistSession();

                    if (request.query.cm === '1') {
                        return response.redirect(request.route.path + '?cm=1');
                    }

                    response.redirect(request.route.path);
                }
            },
            'continue-without-upload': {
                async handle(request: Request, response: Response): Promise<void> {

                    if (that.formActionProcessors != null) {
                        for (const actionProcessorType of that.formActionProcessors) {
                            const actionProcessor = that.httpContext.container.get(actionProcessorType);
                            await actionProcessor.process(request, response);
                        }
                    }

                    const session = request.session;
                    if (session != null) {

                        let applicationData: ApplicationData | undefined = session!.getExtraData(APPLICATION_DATA_KEY);

                        if (!applicationData) {
                            applicationData = {} as ApplicationData;
                            session!.setExtraData(APPLICATION_DATA_KEY, applicationData);
                        }

                        applicationData.appeal =
                            that.prepareSessionModelPriorSave(applicationData.appeal || {}, request.body);

                        await that.persistSession();
                    }

                    return response.redirect(that.navigation.next(request));
                }
            }
        };
    }
}

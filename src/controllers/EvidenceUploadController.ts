import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { Request, Response } from "express";
import { UNPROCESSABLE_ENTITY } from "http-status-codes";
import { inject } from "inversify";
import { controller } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/dts/results";

import { FormActionHandler, FormActionHandlerConstructor } from "app/controllers/BaseController";
import { SafeNavigationBaseController } from "app/controllers/SafeNavigationBaseController";
import { Validator } from "app/controllers/validators/Validator";
import { AuthMiddleware } from "app/middleware/AuthMiddleware";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { CompanyAuthMiddleware } from "app/middleware/CompanyAuthMiddleware";
import { Appeal } from "app/models/Appeal";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { Attachment } from "app/models/Attachment";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { UnsupportedFileTypeError } from "app/modules/file-transfer-service/errors";
import { getEnvOrThrow } from "app/utils/EnvironmentUtils";
import { parseFormData } from "app/utils/MultipartFormDataParser";
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    DOWNLOAD_FILE_PAGE_URI,
    EVIDENCE_QUESTION_URI,
    EVIDENCE_REMOVAL_PAGE_URI,
    EVIDENCE_UPLOAD_PAGE_URI,
    SIGNOUT_PAGE_URI
} from "app/utils/Paths";
import { newUriFactory } from "app/utils/UriFactory";
import {
    addAttachmentToReason,
    getAttachmentsFromReasons,
    getReasonFromReasons
} from "app/utils/appeal/extra.data";
import { Navigation } from "app/utils/navigation/navigation";
import { ValidationError } from "app/utils/validation/ValidationError";
import { ValidationResult } from "app/utils/validation/ValidationResult";

const maxNumberOfFiles: number = Number(getEnvOrThrow("MAX_NUMBER_OF_FILES"));

const template = "evidence-upload";

const navigation: Navigation = {
    previous (): string {
        return EVIDENCE_QUESTION_URI;
    },
    next (): string {
        return CHECK_YOUR_APPEAL_PAGE_URI;
    },
    signOut (): string {
        return SIGNOUT_PAGE_URI;
    },
    actions: (changeMode: boolean) => {
        return {
            noAction: changeMode ? "?cm=1" : "?cm=0",
            uploadFile: changeMode ? "?action=upload-file&cm=1" : "?action=upload-file",
            continueWithoutUpload: "?action=continue-without-upload",
            removeFile: changeMode ? `${EVIDENCE_REMOVAL_PAGE_URI}?cm=1&` : `${EVIDENCE_REMOVAL_PAGE_URI}?`
        };
    }
};

const continueButtonValidator: Validator = {

    async validate (request: Request): Promise<ValidationResult> {

        const applicationData: ApplicationData = request.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData.appeal;

        if (!appeal) {
            throw new Error("Appeal is undefined");
        }

        const attachments: Attachment[] | undefined = getAttachmentsFromReasons(appeal.reasons);

        if (!attachments || attachments.length === 0) {
            return new ValidationResult([new ValidationError("file",
                "You must upload a document or click \"Continue without uploading documents\"")]);
        }

        return new ValidationResult([]);
    }
};

@controller(EVIDENCE_UPLOAD_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware,
    CommonVariablesMiddleware)
export class EvidenceUploadController extends SafeNavigationBaseController<any> {
    constructor (@inject(FileTransferService) private readonly fileTransferService: FileTransferService) {
        super(template, navigation, continueButtonValidator, undefined, undefined);
    }

    protected prepareViewModelFromAppeal (appeal: Appeal): any {
        return {
            ...getReasonFromReasons(appeal.reasons),
            companyNumber: appeal.penaltyIdentifier?.companyNumber
        };
    }

    private async renderUploadError (appeal: Appeal, text: string): Promise<void> {
        const validationResult: ValidationResult = new ValidationResult([
            new ValidationError("file", text)
        ]);

        return await this.renderWithStatus(UNPROCESSABLE_ENTITY)(
            this.template,
            {
                ...this.prepareViewModelFromAppeal(appeal),
                ...this.httpContext.request.body,
                ...this.prepareNavigationConfig(),
                validationResult
            }
        );
    }

    protected getExtraActionHandlers (): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        const that = this;

        const noFileSelectedError: string = "Select a document to add to your application";
        const fileTooLargeError: string = "File size must be smaller than 4MB";
        const fileNotSupportedError: string = "The selected file must be a DOCX, XLSX, PDF, JPEG, PNG or GIF";
        const tooManyFilesError: string = `You can only select up to ${maxNumberOfFiles} files at the same time`;

        return {
            "upload-file": {
                async handle (request: Request, response: Response): Promise<void | RedirectResult> {

                    const applicationData: ApplicationData = request.session!
                        .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

                    const appeal: Appeal = applicationData.appeal;

                    if (!appeal) {
                        throw new Error("Appeal was expected in session but none found");
                    }

                    try {
                        await parseFormData(request, response);
                    } catch (error: any) {
                        switch (error.code) {
                        case "LIMIT_FILE_SIZE":
                            return await that.renderUploadError(appeal, fileTooLargeError);
                        case "LIMIT_UNEXPECTED_FILE":
                            return await that.renderUploadError(appeal, fileNotSupportedError);
                        }
                    }

                    const attachments = getAttachmentsFromReasons(appeal.reasons);

                    if (!request.file) {
                        return await that.renderUploadError(appeal, noFileSelectedError);
                    } else if (attachments && attachments.length >= maxNumberOfFiles) {
                        return await that.renderUploadError(appeal, tooManyFilesError);
                    }

                    let id: string;

                    try {
                        id = await that.fileTransferService.upload(request.file.buffer, request.file.originalname);
                    } catch (err: any) {
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

                    if (request.query.cm === "1") {
                        return that.redirect(request.route.path + "?cm=1");
                    }

                    return that.redirect(request.route.path);
                }
            },
            "continue-without-upload": {
                async handle (request: Request, response: Response): Promise<RedirectResult> {

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

                    }
                    return that.redirect(that.navigation.next(request));
                }
            }
        };
    }
}

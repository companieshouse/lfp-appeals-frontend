import "reflect-metadata";

import { Arg } from "@fluffy-spoon/substitute";
import { expect } from "chai";
import {
    INTERNAL_SERVER_ERROR,
    MOVED_TEMPORARILY,
    OK,
    UNPROCESSABLE_ENTITY
} from "http-status-codes";
import supertest from "supertest";

import "app/controllers/EvidenceUploadController";
import { Appeal } from "app/models/Appeal";
import { Attachment } from "app/models/Attachment";
import { Navigation } from "app/models/Navigation";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { UnsupportedFileTypeError } from "app/modules/file-transfer-service/errors";
import { CHECK_YOUR_APPEAL_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";
import { createSubstituteOf } from "test/SubstituteFactory";

const pageHeading = "Upload documents to support your application";

const maxNumberOfFiles = 10;

const appealNoAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: "NI000000",
        penaltyReference: "A00000001",
        userInputPenaltyReference: "A00000001"
    },
    reasons: {
        other: {
            title: "I have reasons",
            description: "they are legit"
        }
    }
};

const appealWithAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: "NI000000",
        penaltyReference: "A00000001",
        userInputPenaltyReference: "A00000001"
    },
    reasons: {
        other: {
            title: "I have reasons",
            description: "they are legit",
            attachments: [
                {
                    id: "1",
                    name: "some-file.jpeg",
                    url: "http://localhost/appeal-a-penalty/download/prompt/1?c=00345567"
                } as Attachment,
                {
                    id: "2",
                    name: "another-file.jpeg",
                    url: "http://localhost/appeal-a-penalty/download/prompt/2?c=00345567"
                } as Attachment
            ]
        }
    }
};

const appealWithMaxAttachments: Appeal = {
    penaltyIdentifier: {
        companyNumber: "NI000000",
        penaltyReference: "A00000001",
        userInputPenaltyReference: "A00000001"
    },
    reasons: {
        other: {
            title: "I have reasons",
            description: "they are legit",
            attachments: Array(10).fill({ name: "some-file.jpeg" } as Attachment)
        }
    }
};

describe("EvidenceUploadController", () => {

    describe("GET request", () => {
        const navigation: Navigation = {
            permissions: [EVIDENCE_UPLOAD_PAGE_URI]
        };

        it("should return 200 when trying to access the evidence-upload page", async () => {

            const app = createApp({ navigation, appeal: appealNoAttachments });

            await supertest(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                });
        });

        it("should return 200 when trying to access page with attachments in session", async () => {

            const app = createApp({ navigation, appeal: appealWithAttachments });

            await supertest(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect((response: supertest.Response) => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text)
                        .to.include(`href="/appeal-a-penalty/download/data/1/download?c=${appealWithMaxAttachments.penaltyIdentifier.companyNumber}"`)
                        .nested.includes("some-file.jpeg")
                        .to.include(`href="/appeal-a-penalty/download/data/2/download?c=${appealWithMaxAttachments.penaltyIdentifier.companyNumber}"`)
                        .nested.includes("another-file.jpeg");
                });
        });

        it("should return 200 with rendered back button in change mode", async () => {

            const app = createApp({ navigation, appeal: appealNoAttachments });

            await supertest(app).get(EVIDENCE_UPLOAD_PAGE_URI)
                .query("cm=1")
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text)
                        .to.include("href=\"/appeal-a-penalty/check-your-answers\"")
                        .nested.includes("Back");
                });
        });
    });

    describe("POST request: continue", () => {

        it("on continue should redirect to check your appeal page", async () => {

            const app = createApp({ appeal: appealWithAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("?")
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(CHECK_YOUR_APPEAL_PAGE_URI);
                });
        });

        it("on continue should return error when no files have been uploaded", async () => {

            const app = createApp({ appeal: appealNoAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("?")
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain("There is a problem").and
                        .to.contain("You must upload a document or click &quot;Continue without uploading documents&quot;");
                });
        });
    });

    describe("POST request: action=upload-file", () => {

        const buffer = Buffer.from("test data");
        const FILE_NAME: string = "test-file.jpg";
        const UPLOAD_FILE_ACTION: string = "upload-file";

        it("should return 302 and redirect to evidence upload page if no file chosen", async () => {

            const app = createApp({ appeal: appealNoAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=upload-file")
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain("Select a document to add to your application");
                });
        });

        it("should return 302 and redirect to evidence upload page after successful upload", async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.resolve("123"));
            });

            const app = createApp({ appeal: appealWithAttachments }, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI);
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it("should return 302 and redirect to evidence upload page in change mode", async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.resolve("123"));
            });

            const app = createApp({ appeal: appealWithAttachments }, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .query("cm=1")
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(EVIDENCE_UPLOAD_PAGE_URI + "?cm=1");
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it("should return 422 when unsupported media uploaded", async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.reject(new UnsupportedFileTypeError(
                    `File upload failed because type of "${FILE_NAME}" file is not supported`)));
            });

            const app = createApp({ appeal: appealWithAttachments }, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain("There is a problem")
                        .and.to.contain("The selected file must be a DOCX, XLSX, PDF, JPEG, PNG or GIF");
                });

            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it("should return 500 after failed upload", async () => {

            const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                service.upload(Arg.any(), Arg.any()).returns(Promise.reject(new Error("Unexpected error")));
            });

            const app = createApp({ appeal: appealNoAttachments }, container => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
            });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(INTERNAL_SERVER_ERROR);
                    expect(response.text).to.contain("Sorry, there is a problem with the service");
                });
            fileTransferService.received().upload(Arg.any(), FILE_NAME);
        });

        it("should redirect to penalty details page if no appeal in session", async () => {

            const app = createApp({ appeal: undefined });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(PENALTY_DETAILS_PAGE_URI);
                });
        });

        it("should return validation error if file not supported", async () => {

            const unsupportedFileName = "test-file.fake";

            const app = createApp({ appeal: appealNoAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=upload-file")
                .attach("file", buffer, { filename: unsupportedFileName, contentType: "application/json" })
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain("The selected file must be a DOCX, XLSX, PDF, JPEG, PNG or GIF");
                });
        });

        it(`should return validation error when more than ${maxNumberOfFiles} files uploaded`, async () => {

            const app = createApp({ appeal: appealWithMaxAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=upload-file")
                .attach("file", buffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain(`You can only select up to ${maxNumberOfFiles} files at the same time`);
                });
        });

        it("should return validation error if too large of a file has been uploaded", async () => {

            const largeBuffer = Buffer.alloc(5000000);

            const app = createApp({ appeal: appealNoAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + UPLOAD_FILE_ACTION)
                .attach("file", largeBuffer, FILE_NAME)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain("File size must be smaller than 4MB");
                });
        });
    });
    describe("POST request: action=continue-without-upload", () => {
        const NO_UPLOAD_ACTION = "continue-without-upload";

        it("should return 302 and redirect to check your appeals when no attachments present", async () => {

            const app = createApp({ appeal: appealNoAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + NO_UPLOAD_ACTION)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(CHECK_YOUR_APPEAL_PAGE_URI);
                });
        });

        it("should return 302 and redirect to check your appeals when attachments present", async () => {

            const app = createApp({ appeal: appealWithAttachments });

            await supertest(app).post(EVIDENCE_UPLOAD_PAGE_URI)
                .query("action=" + NO_UPLOAD_ACTION)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get("Location")).to.be.equal(CHECK_YOUR_APPEAL_PAGE_URI);
                });
        });
    });
});

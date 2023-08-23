import * as assert from "assert";
import { expect } from "chai";
import {
    CREATED,
    FORBIDDEN,
    INTERNAL_SERVER_ERROR,
    NO_CONTENT,
    NOT_FOUND,
    OK,
    UNSUPPORTED_MEDIA_TYPE
} from "http-status-codes";
import nock = require("nock");

import { FileMetadata } from "app/modules/file-transfer-service/FileMetadata";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import {
    FileNotFoundError, FileNotReadyError,
    FileTransferError,
    UnsupportedFileTypeError
} from "app/modules/file-transfer-service/errors";

import {
    convertReadableToString,
    createReadable
} from "test/modules/file-transfer-service/StreamUtils";

describe("FileTransferService", () => {

    const KEY: string = "mock-key";
    const HOST: string = "http://localhost";
    const URI: string = "/dev/files";

    const fileId = "some-file-id";

    const mockRequest = (method: "get" | "post" | "delete", uri: string, bodyMatcher: {} = {}) =>
        nock(HOST)[method](uri, bodyMatcher, {
            reqheaders: { "x-api-key": KEY }
        });
    const fileTransferService = new FileTransferService(HOST + URI, KEY);

    describe("upload file", () => {

        it("should throw error when file is not provided", () => {

            [undefined, null].forEach(async file => {
                try {
                    await fileTransferService.upload(file!, "filename");
                    assert.fail("Test should failed while it did not");
                } catch (err) {
                    expect(err).to.be.instanceOf(Error).and.to.haveOwnProperty("message")
                        .equal("File is missing");
                }
            });
        });

        it("should throw error when file name is not provided", () => {

            [undefined, null].forEach(async filename => {
                try {
                    await fileTransferService.upload(Buffer.from("This is a test"), filename!);
                    assert.fail("Test should failed while it did not");
                } catch (err) {
                    expect(err).to.be.instanceOf(Error).and.to.haveOwnProperty("message")
                        .equal("File name is missing");
                }
            });
        });

        it("should throw error when unsupported media uploaded", async () => {

            const filename = "test.not_supported";

            mockRequest("post", URI, new RegExp(`form-data; name="upload"; filename="${filename}"`, "m"))
                .reply(UNSUPPORTED_MEDIA_TYPE, {
                    message: "unsupported file type"
                });

            try {
                await fileTransferService.upload(Buffer.from("This is a test"), filename);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(UnsupportedFileTypeError).and.to.haveOwnProperty("message")
                    .equal(`File upload failed because type of "${filename}" file is not supported`);
            }
        });

        it("should throw error when supported media upload failed", async () => {

            const filename = "test.not_supported";

            mockRequest("post", URI, new RegExp(`form-data; name="upload"; filename="${filename}"`, "m"))
                .reply(INTERNAL_SERVER_ERROR, {
                    message: "unable to store file"
                });

            try {
                await fileTransferService.upload(Buffer.from("This is a test"), filename);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                // tslint:disable: max-line-length
                expect(err).to.be.instanceOf(FileTransferError).and.to.haveOwnProperty("message")
                    .equal(`File upload of "${filename}" file failed due to error: request failed with status code 500`);
            }
        });

        it("should return file identifier when supported media upload succeeded", async () => {

            mockRequest("post", URI, new RegExp("form-data; name=\"upload\"; filename=\"test.supported\"", "m"))
                .reply(CREATED, { id: fileId });

            const response = await fileTransferService.upload(Buffer.from("This is a test"), "test.supported");
            expect(response).to.equal(fileId);
        });
    });

    describe("get file metadata", () => {

        it("should throw error when file identifier is not provided", () => {

            [undefined, null].forEach(async invalidFileId => {
                try {
                    await fileTransferService.getFileMetadata(invalidFileId!);
                    assert.fail("Test should failed while it did not");
                } catch (err) {
                    expect(err).to.be.instanceOf(Error).and.to.haveOwnProperty("message")
                        .equal("File ID is missing");
                }
            });
        });

        it("should throw error when file does not exist", async () => {

            mockRequest("get", `${URI}/${fileId}`)
                .reply(NOT_FOUND, {
                    message: "file not found"
                });

            try {
                await fileTransferService.getFileMetadata(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(FileNotFoundError).and.to.haveOwnProperty("message")
                    .equal(`File metadata retrieval failed because "${fileId}" file does not exist`);
            }

        });

        it("should return file metadata if when file exists", async () => {

            const metadata: FileMetadata = {
                av_status: "clean",
                content_type: "application/txt",
                id: fileId,
                name: "hello.txt",
                size: 100
            };

            mockRequest("get", `${URI}/${fileId}`)
                .reply(OK, metadata);

            const response = await fileTransferService.getFileMetadata(fileId);
            expect(response).to.deep.equal(metadata);

        });
    });

    describe("download file", () => {
        it("should throw error when file identifier is not provided", () => {

            [undefined, null].forEach(async invalidFileId => {
                try {
                    await fileTransferService.download(invalidFileId!);
                    assert.fail("Test should failed while it did not");
                } catch (err) {
                    expect(err).to.be.instanceOf(Error).and.to.haveOwnProperty("message")
                        .equal("File ID is missing");
                }
            });
        });

        it("should throw error when file does not exist", async () => {

            mockRequest("get", `${`${URI}/${fileId}`}/download`)
                .reply(NOT_FOUND, {
                    message: "file not found"
                });

            try {
                await fileTransferService.download(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(FileNotFoundError).and.to.haveOwnProperty("message")
                    .equal(`File download failed because "${fileId}" file does not exist`);
            }
        });

        it("should throw error when file is either infected or has not been scanned yet", async () => {

            mockRequest("get", `${`${URI}/${fileId}`}/download`)
                .reply(FORBIDDEN, {
                    message: "this file is not available"
                });

            try {
                await fileTransferService.download(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(FileNotReadyError).and.to.haveOwnProperty("message")
                    .equal(`File download failed because "${fileId}" file is either infected or has not been scanned yet`);
            }
        });

        it("should throw error when file download failed", async () => {

            mockRequest("get", `${`${URI}/${fileId}`}/download`)
                .reply(INTERNAL_SERVER_ERROR, {
                    message: "an internal server error occurred"
                });

            try {
                await fileTransferService.download(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(FileTransferError).and.to.haveOwnProperty("message")
                    .equal(`File download of "${fileId}" file failed due to error: request failed with status code 500`);
            }
        });

        it("should return readable stream with file data when file download succeeded", async () => {

            const fileData = "This is some random text that will be converted to a buffer";

            mockRequest("get", `${`${URI}/${fileId}`}/download`)
                .reply(OK, createReadable(fileData), {
                    "content-disposition": `attachment; filename=hello.txt`
                });

            const readable = await fileTransferService.download(fileId);
            expect(await convertReadableToString(readable)).to.eq(fileData);
        });
    });

    describe("delete file", () => {
        it("should throw error when file identifier is not provided", () => {

            [undefined, null].forEach(async invalidFileId => {
                try {
                    await fileTransferService.delete(invalidFileId!);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error).and.to.haveOwnProperty("message")
                        .equal("File ID is missing");
                }
            });
        });

        it("should throw error when file does not exist", async () => {

            mockRequest("delete", `${URI}/${fileId}`)
                .reply(NOT_FOUND, {
                    message: "file not found"
                });

            try {
                await fileTransferService.delete(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                expect(err).to.be.instanceOf(FileNotFoundError).and.to.haveOwnProperty("message")
                    .equal(`File deletion failed because "${fileId}" file does not exist`);
            }
        });

        it("should throw error when file deletion failed", async () => {

            mockRequest("delete", `${URI}/${fileId}`)
                .reply(INTERNAL_SERVER_ERROR, {
                    message: "failed to delete file"
                });

            try {
                await fileTransferService.delete(fileId);
                assert.fail("Test should failed while it did not");
            } catch (err) {
                // tslint:disable: max-line-length
                expect(err).to.be.instanceOf(FileTransferError).and.to.haveOwnProperty("message")
                    .equal(`File deletion of "${fileId}" file failed due to error: request failed with status code 500`);
            }
        });

        it("should return nothing when file deletion succeeded", async () => {

            mockRequest("delete", `${URI}/${fileId}`)
                .reply(NO_CONTENT);

            const result = await fileTransferService.delete(fileId);
            // tslint:disable-next-line: no-unused-expression
            expect(result).is.undefined;
        });
    });
});

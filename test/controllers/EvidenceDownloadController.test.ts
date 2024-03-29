import "reflect-metadata";

import { Session } from "@companieshouse/node-session-handler";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys";
import { Arg, SubstituteOf } from "@fluffy-spoon/substitute";
import { expect } from "chai";
import { Application } from "express";
import { FORBIDDEN, GATEWAY_TIMEOUT, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "http-status-codes";
import { Container } from "inversify";
import request from "supertest";
import { createSubstituteOf } from "../SubstituteFactory";
import { createDefaultAppeal, createDefaultAttachments } from "../models/AppDataFactory";
import { createReadable } from "../modules/file-transfer-service/StreamUtils";
import { createSession } from "../utils/session/SessionFactory";

import "app/controllers/EvidenceDownloadController";
import { AppealsPermissionKeys } from "app/models/AppealsPermissionKeys";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { AppealsService } from "app/modules/appeals-service/AppealsService";
import { FileMetadata } from "app/modules/file-transfer-service/FileMetadata";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { FileNotReadyError } from "app/modules/file-transfer-service/errors";
import { DOWNLOAD_FILE_PAGE_URI } from "app/utils/Paths";

import { createApp } from "test/ApplicationFactory";

describe("EvidenceDownloadController", () => {

    const DEFAULT_USER_ID = "abc";
    const DEFAULT_ATTACHMENTS = createDefaultAttachments();

    const internalUserAppeal = createDefaultAppeal(DEFAULT_ATTACHMENTS);
    internalUserAppeal.createdBy = { id: DEFAULT_USER_ID };

    const externalUserAppeal = createDefaultAppeal(DEFAULT_ATTACHMENTS);

    function createExternalUserAppConfig (
        fileTransferService: FileTransferService,
        appealsService: AppealsService): Application {

        return createApp(
            { appeal: externalUserAppeal },
            (container: Container) => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
                container.rebind(AppealsService).toConstantValue(appealsService);
            },
            (session: Session) => {
                session.data[SessionKey.SignInInfo]![SignInInfoKeys.UserProfile]!.id = DEFAULT_USER_ID;
                return session;
            }
        );
    }

    function createInternalUserAppConfig (
        fileTransferService: FileTransferService,
        appealsService: AppealsService): Application {

        return createApp(
            {},
            (container: Container) => {
                container.rebind(FileTransferService).toConstantValue(fileTransferService);
                container.rebind(AppealsService).toConstantValue(appealsService);
            },
            (_: Session) => {
                const session = createSession(process.env.COOKIE_SECRET as string, true, true, {
                    [AppealsPermissionKeys.download]: 1,
                    [AppealsPermissionKeys.view]: 1
                });
                session.setExtraData(APPLICATION_DATA_KEY, { appeal: internalUserAppeal });
                return session;
            }
        );
    }

    enum User {
        Internal = "Internal CH user",
        External = "External CH user "
    }

    type AppConfig = {
        user: User,
        links: string[],
        appData: Partial<ApplicationData>,
        configureApp: (fileTransferService: FileTransferService, appealsService: AppealsService) => Application;
    };

    const FILE_ID = DEFAULT_ATTACHMENTS[0].id;
    const APPEAL_ID = "345";

    const appConfigs: AppConfig[] = [
        {
            user: User.Internal,
            links: [
                `${DOWNLOAD_FILE_PAGE_URI}/prompt/${FILE_ID}?a=${APPEAL_ID}&c=NI000000`,
                `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download?a=${APPEAL_ID}&c=NI000000`

            ],
            appData: { appeal: internalUserAppeal },
            configureApp: createInternalUserAppConfig
        },
        {
            user: User.External,
            links: [
                `${DOWNLOAD_FILE_PAGE_URI}/prompt/${FILE_ID}?c=NI000000`,
                `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download?c=NI000000`
            ],
            appData: { appeal: externalUserAppeal },
            configureApp: createExternalUserAppConfig
        }
    ];

    function generateTests (appConfig: AppConfig): void {

        const { user, appData, configureApp } = appConfig;

        describe(`As a ${user}`, () => {

            const contentDisposition = `attachment; filename=${DEFAULT_ATTACHMENTS[0].name}`;

            const expectedGenericErrorMessage = "Sorry, there is a problem with the service";
            const expectedDownloadErrorHeading = "The file can not be downloaded at this moment";
            const expectedDownloadErrorMessage = "Please try again later";

            const metadataClean: FileMetadata = {
                av_status: "clean",
                content_type: DEFAULT_ATTACHMENTS[0].contentType,
                id: DEFAULT_ATTACHMENTS[0].id,
                name: DEFAULT_ATTACHMENTS[0].name,
                size: DEFAULT_ATTACHMENTS[0].size
            };
            describe("GET request: renderPrompt", () => {

                it("should render the prompt page correctly", async () => {

                    const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                        service.download(Arg.any()).resolves(createReadable(""));
                        service.getFileMetadata(Arg.any()).resolves(metadataClean);
                    });

                    const appealsService = createSubstituteOf<AppealsService>(service => {
                        service.getAppeal(Arg.any()).resolves(appData.appeal!);
                    });

                    const app: Application = configureApp(fileTransferService, appealsService);

                    await request(app)
                        .get(appConfig.links[0])
                        .then(res => {
                            appealsService.received();
                            fileTransferService.received();

                            switch (user) {
                            case User.Internal: {
                                expect(res.status).to.eq(200);
                                expect(res.text).to.contain(`href="${appConfig.links[1]}"`);
                                break;
                            }
                            case User.External: {
                                expect(res.status).to.eq(500);
                                break;
                            }
                            }
                        });

                });

                it("should redirect to generic error page if file Id or company number is missing", async () => {

                    const urls = [
                        `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download?a=${APPEAL_ID}`,
                        `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download?c=NI000000`,
                        `${DOWNLOAD_FILE_PAGE_URI}/data/${FILE_ID}/download?`
                    ];

                    for (const url of urls) {

                        const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                            service.download(Arg.any()).resolves(createReadable(""));
                            service.getFileMetadata(Arg.any()).resolves(metadataClean);
                        });

                        const appealsService = createSubstituteOf<AppealsService>(service => {
                            service.getAppeal(Arg.any()).resolves(appData.appeal!);
                        });

                        const app: Application = configureApp(fileTransferService, appealsService);

                        await request(app)
                            .get(url)
                            .then(res => {
                                appealsService.didNotReceive();
                                fileTransferService.didNotReceive();
                                expect(res.status).to.eq(500);
                                expect(res.text).to.contain(expectedGenericErrorMessage);
                            }).catch(console.error);
                    }

                });
            });

            describe("GET request: download", () => {

                it("should start downloading the file when the file is valid", async () => {

                    const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                        service.download(Arg.any()).resolves(createReadable(""));
                        service.getFileMetadata(Arg.any()).resolves(metadataClean);
                    });

                    const appealsService = createSubstituteOf<AppealsService>(service => {
                        service.getAppeal(Arg.any()).resolves(appData.appeal!);
                    });

                    const app: Application = configureApp(fileTransferService, appealsService);

                    await request(app)
                        .get(appConfig.links[1])
                        .then(res => {
                            switch (appConfig.user) {
                            case User.External: {
                                fileTransferService.received().download(Arg.any());
                                appealsService.didNotReceive().getAppeal(Arg.any());
                                break;
                            }
                            case User.Internal: {
                                fileTransferService.received().download(Arg.any());
                                appealsService.received().getAppeal(Arg.any());
                                break;
                            }
                            }

                            expect(res.header["content-disposition"]).eq(contentDisposition);
                            expect(res.status).to.eq(OK);
                        });

                });

                it("should render an error page when the file service fails to download file", async () => {

                    const appealsService = createSubstituteOf<AppealsService>(service => {
                        service.getAppeal(Arg.any()).resolves(appData.appeal!);
                    });

                    const getBrokenFileTransferService =
                        (fileDownloadStatus: number) => {
                            const fileDownloadError = {
                                message: `An error with code ${fileDownloadStatus} occured`,
                                statusCode: fileDownloadStatus
                            };
                            return createSubstituteOf<FileTransferService>(service => {
                                service.download(Arg.any()).rejects(fileDownloadError);
                                service.getFileMetadata(Arg.any()).resolves(metadataClean);
                            });
                        };

                    const testAppWith = async (fileTransferService: SubstituteOf<FileTransferService>) => {

                        const app: Application = configureApp(fileTransferService, appealsService);

                        await request(app)
                            .get(appConfig.links[1])
                            .then(res => {
                                fileTransferService.received();
                                appealsService.received();
                                expect(res.text).to.contain(expectedGenericErrorMessage);
                            });

                    };

                    const statusFailureArray = [NOT_FOUND, INTERNAL_SERVER_ERROR, GATEWAY_TIMEOUT, 0];

                    for (const fileDownloadStatus of statusFailureArray) {
                        const fileTransferService = getBrokenFileTransferService(fileDownloadStatus);
                        await testAppWith(fileTransferService);
                    }
                });

                it("should render custom error page when file service fails to download file with FileNotReady", async () => {

                    const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                        service.download(Arg.any()).rejects(
                            new FileNotReadyError(`File download failed because "${FILE_ID}" file is either infected or has not been scanned yet`)
                        );
                        service.getFileMetadata(Arg.any()).resolves(metadataClean);
                    });

                    const appealsService = createSubstituteOf<AppealsService>(service => {
                        service.getAppeal(Arg.any()).resolves(appData.appeal!);
                    });

                    const app: Application = configureApp(fileTransferService, appealsService);

                    await request(app)
                        .get(appConfig.links[1])
                        .then(res => {
                            fileTransferService.received();
                            appealsService.received();
                            expect(res.status).to.equal(FORBIDDEN);

                            expect(res.header["content-disposition"]).to.be.undefined;
                            expect(res.text)
                                .to.contain(expectedDownloadErrorHeading)
                                .and.to.contain(expectedDownloadErrorMessage);
                        });
                });

                it("should render custom error page during download when the status is invalid", async () => {

                    const createMetadata = (status: string): FileMetadata => {
                        return {
                            av_status: status as any,
                            content_type: metadataClean.content_type,
                            id: FILE_ID,
                            name: metadataClean.name,
                            size: metadataClean.size
                        };
                    };

                    for (const status of ["infected", "not-scanned"]) {

                        const fileTransferService = createSubstituteOf<FileTransferService>(service => {
                            service.download(Arg.any()).rejects(
                                new FileNotReadyError(`File download failed because "${FILE_ID}" file is either infected or has not been scanned yet`)
                            );
                            service.getFileMetadata(Arg.any()).resolves(createMetadata(status));
                        });

                        const appealsService = createSubstituteOf<AppealsService>(service => {
                            service.getAppeal(Arg.any()).resolves(appData.appeal!);
                        });

                        const app: Application = configureApp(fileTransferService, appealsService);

                        await request(app)
                            .get(appConfig.links[1])
                            .then(res => {
                                appealsService.received();
                                fileTransferService.received();
                                expect(res.status).to.equal(FORBIDDEN);

                                expect(res.header["content-disposition"]).to.be.undefined;
                                expect(res.text)
                                    .to.contain(expectedDownloadErrorHeading)
                                    .and.to.contain(expectedDownloadErrorMessage);
                            });
                    }
                });

            });

        });

    }

    appConfigs.forEach(generateTests);

});

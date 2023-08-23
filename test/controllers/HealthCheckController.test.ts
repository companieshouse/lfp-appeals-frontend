import "reflect-metadata";

import { SessionStore } from "@companieshouse/node-session-handler";
import { Application } from "express";
import { Redis } from "ioredis";
import request from "supertest";

import "app/controllers/HealthCheckController";
import { PenaltyIdentifierSchemaFactory } from "app/models/PenaltyIdentifierSchemaFactory";
import { CompaniesHouseSDKFactoryType, CompaniesHouseSDK } from "app/modules/Types";
import { AppealsService } from "app/modules/appeals-service/AppealsService";
import { FileTransferService } from "app/modules/file-transfer-service/FileTransferService";
import { JwtEncryptionService } from "app/modules/jwt-encryption-service/JwtEncryptionService";
import { HEALTH_CHECK_URI } from "app/utils/Paths";

import { createAppConfigurable } from "test/ApplicationFactory";
import { createSubstituteOf } from "test/SubstituteFactory";

describe("HealthCheckController", () => {
    it("should return 200 with status when redis database is up", async () => {
        const app = createAppConfigurable(container => {
            container.bind(SessionStore).toConstantValue(new SessionStore(createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.resolve("OK"));
            })));
            container.bind(FileTransferService).toConstantValue(createSubstituteOf<FileTransferService>());
            container.bind(AppealsService).toConstantValue(createSubstituteOf<AppealsService>());
            container.bind(JwtEncryptionService).toConstantValue(createSubstituteOf<JwtEncryptionService>());
            container.bind(CompaniesHouseSDK).toConstantValue(createSubstituteOf<CompaniesHouseSDKFactoryType>());
            container.bind(PenaltyIdentifierSchemaFactory)
                .toConstantValue(createSubstituteOf<PenaltyIdentifierSchemaFactory>());

        });

        await makeHealthCheckRequest(app).expect(200, "Redis status: 200");
    });

    it("should return 500 with status when redis database is down", async () => {
        const app = createAppConfigurable(container => {
            container.bind(SessionStore).toConstantValue(new SessionStore(createSubstituteOf<Redis>((redis) => {
                redis.ping().returns(Promise.reject(Error("ERROR")));
            })));
            container.bind(FileTransferService).toConstantValue(createSubstituteOf<FileTransferService>());
            container.bind(AppealsService).toConstantValue(createSubstituteOf<AppealsService>());
            container.bind(CompaniesHouseSDK).toConstantValue(createSubstituteOf<CompaniesHouseSDKFactoryType>());
            container.bind(JwtEncryptionService).toConstantValue(createSubstituteOf<JwtEncryptionService>());
            container.bind(PenaltyIdentifierSchemaFactory)
                .toConstantValue(createSubstituteOf<PenaltyIdentifierSchemaFactory>());

        });

        await makeHealthCheckRequest(app).expect(500, "Redis status: 500");
    });

    function makeHealthCheckRequest (app: Application): request.Test {
        return request(app)
            .get(HEALTH_CHECK_URI);
    }
});

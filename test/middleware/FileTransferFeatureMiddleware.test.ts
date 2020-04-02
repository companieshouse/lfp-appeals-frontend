import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach } from 'mocha';
import request from 'supertest';

import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp, getDefaultConfig } from 'test/ApplicationFactory';
import { createFakeSession } from 'test/utils/session/FakeSessionFactory';
const config = getDefaultConfig();

let initialFileTransferFlag: string | undefined;

describe('File Transfer Feature Toggle Middleware', () => {

    beforeEach(() => {
        initialFileTransferFlag = process.env.FILE_TRANSFER_FEATURE;
    });

    afterEach(() => {
        process.env.FILE_TRANSFER_FEATURE = initialFileTransferFlag;
    });

    describe('Feature switched on path', () => {

        it('should call next() if feature flag is on', () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const mockResponse = Substitute.for<Response>();
            const mockRequest = Substitute.for<Request>();
            const mockNext = Substitute.for<NextFunction>();

            const fileTransferMiddleware = new FileTransferFeatureMiddleware().handler;

            fileTransferMiddleware(mockRequest, mockResponse, mockNext);

            // @ts-ignore
            mockResponse.didNotReceive().redirect(Arg.any());
        });

        it('should return evidence upload page if feature flag is on', async () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app)
                .get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(200);
        });

    });

    describe('Feature switched off path', () => {

        it('should redirect if feature flag is off', () => {

            process.env.FILE_TRANSFER_FEATURE = '0';

            const mockResponse = Substitute.for<Response>();
            const mockRequest = Substitute.for<Request>();
            const mockNext = Substitute.for<NextFunction>();

            const fileTransferMiddleware = new FileTransferFeatureMiddleware().handler;

            fileTransferMiddleware(mockRequest, mockResponse, mockNext);

            // @ts-ignore
            mockResponse.received().redirect(Arg.any());
        });

        it('should redirect to entry page if feature flag is off', async () => {

            process.env.FILE_TRANSFER_FEATURE = '0';

            const session = createFakeSession([], config.cookieSecret, true);
            const app = createApp(session);

            await request(app)
                .get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(302)
                .then(res => expect(res.header.location).to.include('/start'));
        });

    });

});

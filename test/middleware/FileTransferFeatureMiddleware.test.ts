import 'reflect-metadata'

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
import { after, before } from 'mocha';
import request from 'supertest';

import 'app/controllers/EvidenceUploadController'
import { FileTransferFeatureMiddleware } from 'app/middleware/FileTransferFeatureMiddleware';
import { ENTRY_PAGE_URI, EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

let initialFileTransferFlag: string | undefined;

describe('File Transfer Feature Toggle Middleware', () => {

    before(() => {
        initialFileTransferFlag = process.env.FILE_TRANSFER_FEATURE;
    });

    after(() => {
        process.env.FILE_TRANSFER_FEATURE = initialFileTransferFlag;
    });

    describe('Feature switched on', () => {

        it('should call next() if feature flag is on', () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            new FileTransferFeatureMiddleware().handler(mockRequest, mockResponse, mockNext);

            // @ts-ignore
            mockResponse.didNotReceive().redirect(Arg.any());
        });

        it('should return evidence upload page if feature flag is on', async () => {

            process.env.FILE_TRANSFER_FEATURE = '1';

            const app = createApp({});

            await request(app)
                .get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(OK);
        });

    });

    describe('Feature switched off', () => {

        it('should redirect if feature flag is off', () => {

            process.env.FILE_TRANSFER_FEATURE = '0';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            new FileTransferFeatureMiddleware().handler(mockRequest, mockResponse, mockNext);

            // @ts-ignore
            mockResponse.received().redirect(Arg.any());
        });

        it('should redirect to entry page if feature flag is off', async () => {

            process.env.FILE_TRANSFER_FEATURE = '0';

            const app = createApp({});

            await request(app)
                .get(EVIDENCE_UPLOAD_PAGE_URI)
                .expect(MOVED_TEMPORARILY)
                .then(res => expect(res.header.location).to.include(ENTRY_PAGE_URI));
        });

    });

});

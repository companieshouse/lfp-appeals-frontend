import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
import { after, before } from 'mocha';
import request from 'supertest';

import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { ENTRY_PAGE_URI, ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

let initialIllnessReasonFeatureFlag: string | undefined;

describe('Illness Reason Feature Toggle Middleware', () => {

    before(() => {
        initialIllnessReasonFeatureFlag = process.env.ILLNESS_REASON_FEATURE;
    });

    after(() => {
        process.env.ILLNESS_REASON_FEATURE = initialIllnessReasonFeatureFlag;
    });

    describe('Feature switched on', () => {

        it('should call next() if feature flag is on', () => {

            process.env.ILLNESS_REASON_FEATURE = '1';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            new IllnessReasonFeatureMiddleware().handler(mockRequest, mockResponse, mockNext);

            mockResponse.didNotReceive().redirect(Arg.any());
        });

        it('should return illness start date page if feature flag is on', async () => {

            process.env.ILLNESS_REASON_FEATURE = '1';

            const app = createApp({});

            await request(app)
                .get(ILLNESS_START_DATE_PAGE_URI)
                .expect(OK);
        });

    });

    describe('Feature switched off', () => {

        it('should redirect if feature flag is off', () => {

            process.env.ILLNESS_REASON_FEATURE = '0';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            new IllnessReasonFeatureMiddleware().handler(mockRequest, mockResponse, mockNext);

            mockResponse.received().redirect(Arg.any());
        });

        it('should redirect to entry page if feature flag is off', async () => {

            process.env.ILLNESS_REASON_FEATURE = '0';

            const app = createApp({});

            await request(app)
                .get(ILLNESS_START_DATE_PAGE_URI)
                .expect(MOVED_TEMPORARILY)
                .then(res => expect(res.header.location).to.include(ENTRY_PAGE_URI));
        });

    });

});

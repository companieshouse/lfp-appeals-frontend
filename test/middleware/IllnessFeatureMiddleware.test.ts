import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { NextFunction, Request, Response } from 'express';
import { after, before } from 'mocha';

import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

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

            mockResponse.didNotReceive().redirect(Arg.is(arg => arg === ENTRY_PAGE_URI));
        });
    });

    describe('Feature switched off', () => {

        it('should redirect if feature flag is off', () => {

            process.env.ILLNESS_REASON_FEATURE = '0';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            new IllnessReasonFeatureMiddleware().handler(mockRequest, mockResponse, mockNext);

            mockResponse.received().redirect(Arg.is(arg => arg === ENTRY_PAGE_URI));
        });
    });

});

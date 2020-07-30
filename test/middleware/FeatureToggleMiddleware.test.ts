import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { after, before } from 'mocha';

import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { Feature } from 'app/utils/Feature';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

let initialIllnessReasonFeatureFlag: string | undefined;

describe('Illness Reason Feature Toggle Middleware', () => {

    before(() => {
        initialIllnessReasonFeatureFlag = process.env.ILLNESS_REASON_FEATURE_ENABLED;
    });

    after(() => {
        process.env.ILLNESS_REASON_FEATURE_ENABLED = initialIllnessReasonFeatureFlag;
    });

    it('should throw error if feature is invalid', () => {

        const mockRequest = Substitute.for<Request>();
        const mockResponse = Substitute.for<Response>();
        const mockNext = Substitute.for<NextFunction>();

        [undefined, null].forEach(invalidFeature => {
            expect(() =>
                FeatureToggleMiddleware(invalidFeature as any)(mockRequest, mockResponse, mockNext))
                .to.throw('Feature must be defined');

            mockNext.didNotReceive();
            mockResponse.didNotReceive();
        });
    });

    describe('Feature switched on', () => {

        it('should call next() if feature flag is on', () => {

            process.env.ILLNESS_REASON_FEATURE_ENABLED = '1';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const featureList: Feature[] = Object.values(Feature);

            featureList.forEach((feature) => {
                FeatureToggleMiddleware(feature)(mockRequest, mockResponse, mockNext);
                mockResponse.didNotReceive().redirect(Arg.is(arg => arg === ENTRY_PAGE_URI));
            });
        });
    });

    describe('Feature switched off', () => {

        it('should redirect if feature flag is off', () => {

            process.env.ILLNESS_REASON_FEATURE_ENABLED = '0';

            const mockRequest = Substitute.for<Request>();
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const featureList: Feature[] = Object.values(Feature);

            featureList.forEach((feature) => {
                FeatureToggleMiddleware(feature)(mockRequest, mockResponse, mockNext);
                mockResponse.received().redirect(Arg.is(arg => arg === ENTRY_PAGE_URI));
            });
        });
    });
});

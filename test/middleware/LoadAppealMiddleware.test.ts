import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { Maybe } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { createSubstituteOf } from '../SubstituteFactory';
import { createDefaultAppeal, createDefaultAttachments } from '../models/AppDataFactory';
import { createSession } from '../utils/session/SessionFactory';

import { APPEAL_ID_QUERY_KEY, COMPANY_NUMBER_QUERY_KEY, LoadAppealMiddleware } from 'app/middleware/LoadAppealMiddleware';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { AppealNotFoundError, AppealServiceError } from 'app/modules/appeals-service/errors';

describe('LoadAppealMiddleware', () => {

    const appealId = '123';
    const companyId = 'NI000000';
    // @ts-ignore
    const createAppealService = (method: 'resolves' | 'rejects', data?: Appeal | any) => {
        const service = Substitute.for<AppealsService>();
        service.getAppeal(Arg.all())[method](data);
        return service;

    };

    const DEFAULT_ATACHMENTS = createDefaultAttachments();

    const getRequestSubsitute = (data?: Partial<ApplicationData>): Request => {

        const session = createSession('secret');
        session.data[SessionKey.ExtraData] = {
            appeals: { ...data } || undefined
        };

        return {
            session: Maybe.of(session),
            query: {
                [COMPANY_NUMBER_QUERY_KEY]: companyId,
                [APPEAL_ID_QUERY_KEY]: appealId
            } as any
        } as Request;
    };

    const expectException = async (service: AppealsService,
        exceptionName: 'AppealNotFoundError' | 'AppealServiceError') => {

        const request = getRequestSubsitute();

        const loadAppealMiddleware = new LoadAppealMiddleware(service);

        const response = createSubstituteOf<Response>();
        // @ts-ignore
        const nextFunction = createSubstituteOf<NextFunction>();

        try {
            await loadAppealMiddleware.handler(request, response, nextFunction);
        } catch (err) {
            expect(err.constructor.name).to.eq(exceptionName);
            nextFunction.didNotReceive();
            response.didNotReceive();
        }

    };

    describe('After signing in, user tries to access evidence download endpoints', () => {

        it('should load the appeal from API if user obtained link from other medium', async () => {

            const appData = { appeal: createDefaultAppeal(DEFAULT_ATACHMENTS) };
            const request: Request = getRequestSubsitute();

            const appealService = createAppealService('resolves', appData.appeal!);
            const loadAppealMiddleware = new LoadAppealMiddleware(appealService);

            const nextFunction = createSubstituteOf<NextFunction>();
            const response = createSubstituteOf<Response>();

            await loadAppealMiddleware.handler(request, response, nextFunction);

            appealService.received().getAppeal(Arg.all());

            const appeal: Appeal = await request.session
                .extract()?.data[SessionKey.ExtraData][APPLICATION_DATA_KEY].appeal;

            expect(appeal).to.deep.equal(appData.appeal);
            nextFunction.received(1);

        });

        it('should call next when the user has an active session with appeal data', async () => {

            const appData = { appeal: createDefaultAppeal(DEFAULT_ATACHMENTS) };
            const request: Request = getRequestSubsitute(appData);

            const appealService = createAppealService('resolves', appData.appeal!);
            const loadAppealMiddleware = new LoadAppealMiddleware(appealService);

            const nextFunction = createSubstituteOf<NextFunction>();
            const response = createSubstituteOf<Response>();

            await loadAppealMiddleware.handler(request, response, nextFunction);
            nextFunction.received(1);
            appealService.didNotReceive().getAppeal(Arg.all());

        });

        it('should throw an error if the company number is invalid', async () => {

            const appData = { appeal: createDefaultAppeal(DEFAULT_ATACHMENTS) };
            const request: Request = getRequestSubsitute(appData);

            request.query[COMPANY_NUMBER_QUERY_KEY] = 'abc';

            const appealService = createAppealService('resolves', appData.appeal!);
            const loadAppealMiddleware = new LoadAppealMiddleware(appealService);

            const nextFunction = createSubstituteOf<NextFunction>();
            const response = createSubstituteOf<Response>();

            try {

                await loadAppealMiddleware.handler(request, response, nextFunction);
                nextFunction.didNotReceive();
                appealService.didNotReceive().getAppeal(Arg.all());

            } catch (err) {
                expect(err.message).to.equal('Tried to load appeal from an invalid company number');
            }
        });

        it('should throw an error if the appeal id is not found', async () => {

            const service = createAppealService('rejects', new AppealNotFoundError('Appeal not found'));
            await expectException(service, 'AppealNotFoundError');
        });

        it('should throw an error if appeals service fails', async () => {
            const service = createAppealService('rejects', new AppealServiceError('Internal Server Error'));
            await expectException(service, 'AppealServiceError');
        });

    });

});
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { assert, expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { createSubstituteOf } from '../SubstituteFactory';
import { createSession } from '../utils/session/SessionFactory';

import { PenaltyReferenceRouter } from 'app/middleware/PenaltyReferenceRouter';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Reasons } from 'app/models/Reasons';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

describe('PenaltyReferenceRouter', () => {
    it('should throw an exception if the session does not exist', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();
        try {
            penaltyReferenceRouter.handler(
                {} as Request,
                createSubstituteOf<Response>(),
                createSubstituteOf<NextFunction>()
            );
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }

    });
    it('should throw an exception if there is no application data', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();
        try {
            const session = createSession('secret', true);
            penaltyReferenceRouter.handler(
                { session } as Request,
                createSubstituteOf<Response>(),
                createSubstituteOf<NextFunction>()
            );
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(APPLICATION_DATA_UNDEFINED.message);
        }

    });
    it('should throw an exception if the penalty list is undefined', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();
        try {

            const session = createSession('secret', true);

            session.setExtraData<Partial<ApplicationData>>(APPLICATION_DATA_KEY, {
                appeal: {
                    penaltyIdentifier: {
                        companyNumber: 'NI000000',
                        userInputPenaltyReference: 'A0000001',
                        companyName: 'test'
                    },
                    reasons: {} as Reasons
                }
            });

            penaltyReferenceRouter.handler(
                { session } as Request,
                createSubstituteOf<Response>(),
                createSubstituteOf<NextFunction>()
            );

            assert.fail('Should have thrown an error');

        } catch (err) {
            expect(err.message).to.equal(PenaltyReferenceRouter.PENALTY_LIST_UNDEFINED_ERROR.message);
        }

    });
    it('should call redirect to the review penalty page if there is one penalty in the list', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();

        const session = createSession('secret', true);

        session.setExtraData<Partial<ApplicationData>>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    userInputPenaltyReference: 'A0000001',
                    companyName: 'test',
                    penaltyList: {
                        items: [{ id: 'A0000001' } as Penalty]
                    } as PenaltyList
                },
                reasons: {} as Reasons
            }
        });

        const response = createSubstituteOf<Response>();
        const nextFunction = createSubstituteOf<NextFunction>();

        penaltyReferenceRouter.handler(
            {
                query: {},
                session
            } as Request,
            response,
            nextFunction
        );

        response.received(1).redirect(REVIEW_PENALTY_PAGE_URI);
        nextFunction.didNotReceive();

    });
    it('should call next if there are more than one penalty in the list', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();

        const session = createSession('secret', true);

        session.setExtraData<Partial<ApplicationData>>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    userInputPenaltyReference: 'PEN1A/ABCEFG',
                    companyName: 'test',
                    penaltyList: {
                        items: [{ id: 'A0000001' } as Penalty, { id: 'A0000002' } as Penalty]
                    } as PenaltyList
                },
                reasons: {} as Reasons
            }
        });

        const response = createSubstituteOf<Response>();
        const nextFunction = createSubstituteOf<NextFunction>();

        penaltyReferenceRouter.handler(
            { session } as Request,
            response,
            nextFunction
        );

        response.didNotReceive();
        nextFunction.received();
    });

    it('should redirect to the penalty details page when list contains 1 penalty and back button flag is set', () => {

        const penaltyReferenceRouter = new PenaltyReferenceRouter();

        const session = createSession('secret', true);

        session.setExtraData<Partial<ApplicationData>>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    userInputPenaltyReference: 'PEN1A/ABCEFG',
                    companyName: 'test',
                    penaltyList: {
                        items: [{ id: 'A0000001' } as Penalty]
                    } as PenaltyList
                },
                reasons: {} as Reasons
            }
        });

        const response = createSubstituteOf<Response>();
        const nextFunction = createSubstituteOf<NextFunction>();

        penaltyReferenceRouter.handler(
            {
                query: {
                    back: 'true'
                } as any,
                session
            } as Request,
            response,
            nextFunction
        );

        response.didNotReceive();
        nextFunction.received();
    });
});
import { Session } from '@companieshouse/node-session-handler';
import { NextFunction, Request, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

@provide(PenaltyReferenceRouter)
export class PenaltyReferenceRouter extends BaseMiddleware {

    public static PENALTY_LIST_UNDEFINED_ERROR: Error = new Error('Penalty list in appeal was expected but was undefined');

    public handler(req: Request, res: Response, next: NextFunction): void {
        const session: Session | undefined = req.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const applicationData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);

        if (!applicationData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        const numberOfPenalties: number | undefined = applicationData
            .appeal
            .penaltyIdentifier
            .penaltyList?.items
            .length;

        if (!numberOfPenalties) {
            throw PenaltyReferenceRouter.PENALTY_LIST_UNDEFINED_ERROR;
        }

        if (numberOfPenalties === 1) {
            if (req.query.back) {
                res.redirect(PENALTY_DETAILS_PAGE_URI);
            } else {
                res.redirect(REVIEW_PENALTY_PAGE_URI);
            }
        } else {
            next();
        }

    }

}
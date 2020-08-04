import { Session } from 'ch-node-session-handler';
import { NextFunction, Request, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { ReasonType } from 'app/models/fields/ReasonType';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';
import { ILL_PERSON_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from 'app/utils/Paths';

@provide(ReasonRouter)
export class ReasonRouter extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        if (!isFeatureEnabled(Feature.ILLNESS_REASON)) {
            return next();
        }

        const session: Session | undefined = req.session;
        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const applicationData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);
        if (!applicationData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        const reason = applicationData.appeal.currentReasonType;
        let redirect: string | undefined;

        switch(reason) {
            case ReasonType.illness:
                redirect = ILL_PERSON_PAGE_URI;
                break;
        }

        if (redirect) {
            loggerInstance().info(`User requested ${reason} reason - redirecting to ${redirect}`);
            res.redirect(redirect);
        } else {
            loggerInstance()
                .info(`User requested ${reason} reason - defaulting to ${OTHER_REASON_DISCLAIMER_PAGE_URI}`);
            next();
        }
    }
}
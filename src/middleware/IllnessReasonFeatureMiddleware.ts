import { NextFunction, Request, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

@provide(IllnessReasonFeatureMiddleware)
export class IllnessReasonFeatureMiddleware extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        if (isFeatureEnabled(Feature.ILLNESS_REASON)) {
            next();
        } else {
            loggerInstance().info(`Illness reason feature is disabled - request to ${req.url} got redirected to ${ENTRY_PAGE_URI}`);
            res.redirect(ENTRY_PAGE_URI);
        }
    }
}

import { NextFunction, Request, RequestHandler, Response } from 'express';

import { loggerInstance } from 'app/middleware/Logger';
import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

export function FeatureToggleMiddleware(feature: Feature): RequestHandler {

    if (!feature) {
        throw Error('Feature must be defined');
    }

    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        if (isFeatureEnabled(feature)) {
            return next();
        } else {
            loggerInstance().info(`Feature [${feature}] is disabled - request to ${req.url} got redirected to ${ENTRY_PAGE_URI}`);
            return res.redirect(ENTRY_PAGE_URI);
        }
    };
}

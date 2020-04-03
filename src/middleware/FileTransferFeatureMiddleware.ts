import { NextFunction, Request, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { getEnv } from 'app/utils/EnvironmentUtils';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

@provide(FileTransferFeatureMiddleware)
export class FileTransferFeatureMiddleware extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        if (getEnv('FILE_TRANSFER_FEATURE') === '1') {
            next();
        } else {
            loggerInstance().info(`File transfer feature is disabled - request to ${req.url} got redirected to ${ENTRY_PAGE_URI}`);
            res.redirect(ENTRY_PAGE_URI);
        }
    }
}

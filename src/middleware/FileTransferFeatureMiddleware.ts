import { NextFunction, Request, RequestHandler, Response } from 'express';
import { injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { getEnv } from 'app/utils/EnvironmentUtils';
import { ENTRY_PAGE_URI } from 'app/utils/Paths';

@injectable()
export class FileTransferFeatureMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        loggerInstance().info(`${FileTransferFeatureMiddleware.name} - handler: request url is ` + req.url);

        if (getEnv('FILE_TRANSFER_FEATURE') === '1') {
            next();
        } else {
            res.redirect(ENTRY_PAGE_URI);
        }
    }
}

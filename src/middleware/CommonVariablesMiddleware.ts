import { NextFunction, Request, RequestHandler, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

@provide(CommonVariablesMiddleware)
export class CommonVariablesMiddleware extends BaseMiddleware {
    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        const session = req.session;

        // Populate user email for use in signout bar.
        const email = session?.data?.signin_info?.user_profile?.email;
        if (email !== undefined) {
            res.locals.userEmail = email;
        }

        next();
    }
}
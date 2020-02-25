import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getEnvOrDefault } from '../utils/EnvironmentUtils';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { injectable } from 'inversify';
import { PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';
import { VerifiedSession } from 'ch-node-session-handler/lib/session/model/Session';

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        req.session
            .chain((session: VerifiedSession) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .filter((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1)
            .ifNothing(() => {
                res.redirect(`${getEnvOrDefault('ACCOUNT_URL', '')}/signin?return_to=${PENALTY_DETAILS_PAGE_URI}`);
            });

        return next();
    };

}

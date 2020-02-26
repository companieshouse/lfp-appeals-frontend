import { BaseMiddleware } from 'inversify-express-utils';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getEnvOrDefault } from '../utils/EnvironmentUtils';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { injectable } from 'inversify';
import { PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';
import { VerifiedSession } from 'ch-node-session-handler/lib/session/model/Session';
import { Maybe } from 'ch-node-session-handler';

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        const signedIn: Maybe<boolean> = req.session
            .chain((session: VerifiedSession) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1);

        if (!signedIn.orDefault(false)) {
            res.redirect(`${getEnvOrDefault('ACCOUNT_URL', '')}/signin?return_to=${PENALTY_DETAILS_PAGE_URI}`);
        } else {
            next();
        }
    }

}

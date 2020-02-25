import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { returnEnvVarible } from "../utils/EnvironmentUtils";
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { injectable } from 'inversify';
import { ROOT_URI, PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';
import { VerifiedSession } from 'ch-node-session-handler/lib/session/model/Session';

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        req.session
            .chain((session: VerifiedSession) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .filter((siginInInfo: ISignInInfo) => siginInInfo[SignInInfoKeys.SignedIn] === 1)
            .ifNothing(() => {
                res.redirect(`${returnEnvVarible('REDIRECT_URL')}?return_to=${PENALTY_DETAILS_PAGE_URI}`);
            });

        return next();

    };

}

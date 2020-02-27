import { BaseMiddleware } from 'inversify-express-utils';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { injectable } from 'inversify';
import { VerifiedSession } from 'ch-node-session-handler/lib/session/model/Session';
import { Maybe } from 'ch-node-session-handler';

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        const signedIn: Maybe<boolean> = req.session
            .chain((session: VerifiedSession) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1);

        if (!signedIn.orDefault(false)) {
            res.redirect('/signin?return_to=' + req.originalUrl);
        }
        next();
    }

}

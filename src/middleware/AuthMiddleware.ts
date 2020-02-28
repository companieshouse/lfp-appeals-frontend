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

        req.session.ifNothing(() => console.log(`${req.url}: Session object is missing!`));

        req.session.map((session: VerifiedSession) => {
            console.log(`${req.url}: Session object Present!\n`);
            console.log(`Session Content:\n`);
            console.log(session.data);

        });

        const signedIn: boolean = req.session
            .chain((session: VerifiedSession) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1)
            .orDefault(false);

        if (!signedIn) {
            console.log('Not signed in... Redirecting to ' + '/signin?return_to=' + req.originalUrl);
            res.redirect('/signin?return_to=' + req.originalUrl);
        } else {
            console.log('Going to controller...');
            next();
        }
    };

}

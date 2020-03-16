import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { Session } from 'ch-node-session-handler/lib/session/model/Session';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';

import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

function buildReturnUri(req: Request): string {
    return new URL(PENALTY_DETAILS_PAGE_URI, `${req.protocol}://${req.headers.host}`).href
}

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        req.session.ifNothing(() => console.log(`${req.url}: Session object is missing!`));

        const signedIn: boolean = req.session
            .chain((session: Session) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1)
            .orDefault(false);

        if (!signedIn) {
            const redirectURI = `${getEnvOrDefault('ACCOUNT_WEB_URL', '')}/signin?return_to=${buildReturnUri(req)}`;
            console.log(`Not signed in... Redirecting to: ${redirectURI}`);
            return res.redirect(redirectURI);
        }

        console.log('Going to controller....');
        next();
    };

}

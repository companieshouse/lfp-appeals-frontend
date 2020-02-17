import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { returnEnvVarible } from '../utils/ConfigLoader';
import { ISignInInfo } from 'ch-node-session/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session/lib/session/keys/SignInInfoKeys';
import { ROOT_URI } from '../utils/Paths';

@provide(AuthMiddleware)
export class AuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        if (req.cookies.__SID) {
            const signInInfo = req.session.chain(session => session.getValue<ISignInInfo>(SessionKey.SignInInfo));
            const returnURL = req.query.returnURL
            signInInfo.map(info => {
                if (info[SignInInfoKeys.SignedIn] !== 1) {
                    res.redirect(`${returnEnvVarible('REDIRECT_URL')}?returnTo=${ROOT_URI}`);
                }
            });

        } else {
            res.redirect(`${returnEnvVarible('REDIRECT_URL')}?returnTo=${ROOT_URI}`);
        }
        return next();
    };

}
import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { returnEnvVarible } from '../utils/ConfigLoader';
import { ISignInInfo } from 'ch-node-session/lib/session/model/SessionInterfaces';
import { SessionKey } from 'ch-node-session/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session/lib/session/keys/SignInInfoKeys';
import { injectable } from 'inversify';
import { ROOT_URI } from '../utils/Paths';

@injectable()
export class AuthMiddleware extends BaseMiddleware {

    private defaultReturnUrl: string = ROOT_URI;
    private queue: string[] = [this.defaultReturnUrl];

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {

        const returnURL = this.popReturnURL();

        if (req.cookies.__SID) {
            const signInInfo = req.session.chain(session => session.getValue<ISignInInfo>(SessionKey.SignInInfo));
            signInInfo.map(info => {
                if (info[SignInInfoKeys.SignedIn] !== 1) {
                    res.redirect(`${returnEnvVarible('REDIRECT_URL')}?returnTo=${returnURL}`);
                }
            });

        } else {
            res.redirect(`${returnEnvVarible('REDIRECT_URL')}?returnTo=${returnURL}`);
        }
        return next();
    };

    public setReturnURL(url: string): void {
        this.queue[1] = url;
    }

    private popReturnURL(): string {
        if (this.queue.length > 1) {
            const lastElement = this.queue.pop();
            return lastElement ? lastElement : '';
        }
        return this.queue[0];
    }

}
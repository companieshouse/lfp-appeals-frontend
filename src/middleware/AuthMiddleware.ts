import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { Session } from 'ch-node-session-handler/lib/session/model/Session';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { loggerInstance } from './Logger';

import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';
import { newUriFactory } from 'app/utils/UriFactory';

@provide(AuthMiddleware)
export class AuthMiddleware extends BaseMiddleware {

    public getReturnToPage(req: Request): string {
        return newUriFactory(req).createAbsoluteUri(PENALTY_DETAILS_PAGE_URI);
    }

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        req.session
            .ifNothing(() => loggerInstance().debug(`${AuthMiddleware.name} - handler: Session object is missing!`));

        const signedIn: boolean = req.session
            .chain((session: Session) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.SignedIn] === 1)
            .orDefault(false);

        const userId = req.session
            .chain((session: Session) => session.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .chainNullable((signInInfo: ISignInInfo) => signInInfo[SignInInfoKeys.UserProfile])
            .map((userProfile: IUserProfile) => userProfile.id)
            .extract();

        if (!signedIn) {
            const redirectURI = `${getEnvOrDefault('ACCOUNT_WEB_URL', '')}/signin?return_to=${this.getReturnToPage(req)}`;
            loggerInstance().info(`${AuthMiddleware.name} - handler: userId=${userId}, Not signed in... Redirecting to: ${redirectURI}`);
            return res.redirect(redirectURI);
        }

        loggerInstance().debug(`${AuthMiddleware.name} - handler: userId=${userId}, Going to controller....`);
        next();
    }

}

// tslint:disable-next-line: max-classes-per-file
@provide(FileRestrictionsAuthMiddleware)
export class FileRestrictionsAuthMiddleware extends AuthMiddleware {
    public getReturnToPage(req: Request): string {
        return newUriFactory(req).createAbsoluteUri(req.originalUrl);
    }
}

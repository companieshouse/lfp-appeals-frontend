import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys";
import { ISignInInfo, IUserProfile } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { provide } from "inversify-binding-decorators";
import { BaseMiddleware } from "inversify-express-utils";
import { loggerInstance } from "./Logger";

import { PENALTY_DETAILS_PAGE_URI } from "app/utils/Paths";
import { newUriFactory } from "app/utils/UriFactory";

@provide(AuthMiddleware) // eslint-disable-line no-use-before-define
export class AuthMiddleware extends BaseMiddleware {

    public getReturnToPage (req: Request): string {
        return newUriFactory(req).createAbsoluteUri(PENALTY_DETAILS_PAGE_URI);
    }

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        if (!req.session) {
            loggerInstance().debug(`${AuthMiddleware.name} - handler: Session object is missing!`);
        }

        const signInInfo: ISignInInfo = req.session?.get<ISignInInfo>(SessionKey.SignInInfo) || {};

        const signedIn: boolean = signInInfo![SignInInfoKeys.SignedIn] === 1 || false;

        const userProfile: IUserProfile = signInInfo![SignInInfoKeys.UserProfile] || {};

        const userId: string | undefined = userProfile?.id;

        if (!signedIn) {
            const redirectURI = `/signin?return_to=${this.getReturnToPage(req)}`;
            loggerInstance().info(`${AuthMiddleware.name} - handler: userId=${userId}, Not signed in... Redirecting to: ${redirectURI}`);
            return res.redirect(redirectURI);
        }

        loggerInstance().debug(`${AuthMiddleware.name} - handler: userId=${userId}, Going to controller....`);
        next();
    };

}

@provide(FileRestrictionsAuthMiddleware) // eslint-disable-line no-use-before-define
export class FileRestrictionsAuthMiddleware extends AuthMiddleware {
    public getReturnToPage (req: Request): string {
        return encodeURIComponent(newUriFactory(req).createAbsoluteUri(req.originalUrl));
    }
}

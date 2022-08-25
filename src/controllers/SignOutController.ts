import { Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request, Response} from 'express';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { SIGNOUT_RETURN_URL_SESSION_KEY } from 'app/Constants';
import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { loggerInstance } from 'app/middleware/Logger';
import { SessionStoreConfig } from 'app/models/SessionConfig';
import { ACCOUNTS_SIGNOUT_URI, SIGNOUT, SIGNOUT_PAGE_URI } from 'app/utils/Paths';

const sessionConfig: SessionStoreConfig = SessionStoreConfig.createFromEnvironmentVariables();

@controller(SIGNOUT_PAGE_URI, SessionMiddleware)
export class SignOutController extends BaseAsyncHttpController {

    @httpGet('')
    public async redirectView (): Promise<void> {
        const returnPage = this.saveReturnPageInSession(this.httpContext.request);
        const session: Session | undefined = this.httpContext.request.session;
        if (!session) {
            throw new Error('Session was expected but none found');
        }
        await this.saveSession(session, this.httpContext.request, this.httpContext.response);
        return this.render(SIGNOUT, {
            backLinkUrl: returnPage
        });
    }

    @httpPost('')
    public async postPage(): Promise<void> {
        const returnPage = this.getReturnPageFromSession(this.httpContext.request.session as Session);

        switch (this.httpContext.request.body.signingOut) {
            case 'yes':
                return this.httpContext.response.redirect(ACCOUNTS_SIGNOUT_URI);
            case 'no':
                return this.httpContext.response.redirect(returnPage);
            default:
                return this.showMustSelectButtonError(returnPage);
            }
    }

    private saveReturnPageInSession(req: Request): string {
        const returnPageUrl = req.headers.referer!;
        req.session?.setExtraData(SIGNOUT_RETURN_URL_SESSION_KEY, returnPageUrl);
        return returnPageUrl;
    }

    private getReturnPageFromSession(session: Session): string {
        const returnPage = session?.getExtraData(SIGNOUT_RETURN_URL_SESSION_KEY);
        if (returnPage !== undefined && typeof returnPage === 'string') return returnPage;

        loggerInstance().error(`Unable to find page to return the user to. `
            + `It should have been a string value stored in the session extra data with key signout-return-to-url. `
            + `However, ${JSON.stringify(returnPage)} was there instead.`);

        throw new Error(`Cannot find url of page to return user to.`);
    }

    private async showMustSelectButtonError(returnPage: string): Promise<void> {
        return this.renderWithStatus(400)(
            'signout', {
                backLinkUrl: returnPage,
                noInputSelectedError: true
            });
    }

    private async saveSession(session: Session, req: Request, res: Response): Promise<void> {
        await this.httpContext.container
            .get(SessionStore)
            .store(
                Cookie.createFrom(req.cookies[sessionConfig.sessionCookieName]), 
                session!.data,
                sessionConfig.sessionTimeToLiveInSeconds);

        const cookie = {
            domain: sessionConfig.sessionCookieDomain,
            path: '/',
            httpOnly: true,
            secure: sessionConfig.sessionCookieSecureFlag === 'true',
            maxAge: sessionConfig.sessionTimeToLiveInSeconds * 1000,
            encode: String
        };

        res.cookie(
            sessionConfig.sessionCookieName,
            this.httpContext.request.cookies[sessionConfig.sessionCookieName],
            cookie);
    }
}

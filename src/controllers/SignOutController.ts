import { Session, SessionMiddleware } from '@companieshouse/node-session-handler';
import { Request } from 'express';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { RedirectResult } from 'inversify-express-utils/dts/results';

import { SIGNOUT_RETURN_URL_SESSION_KEY } from 'app/Constants';
import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { loggerInstance } from 'app/middleware/Logger';
import { ACCOUNTS_SIGNOUT_URI, SIGNOUT, SIGNOUT_PAGE_URI } from 'app/utils/Paths';

const template = 'signout';

@controller(SIGNOUT_PAGE_URI, SessionMiddleware)
export class SignOutController extends BaseAsyncHttpController {

    @httpGet('')
    public async redirectView (): Promise<void> {
        const returnPage = this.saveReturnPageInSession(this.httpContext.request);
        const session: Session | undefined = this.httpContext.request.session;
        if (!session) {
            throw new Error('Session was expected but none found');
        }

        return this.render(SIGNOUT, {
            backLinkUrl: returnPage,
            templateName : template
        });
    }

    @httpPost('')
    public async postPage(): Promise<void | RedirectResult> {
        const returnPage = this.getReturnPageFromSession(this.httpContext.request.session as Session);

        switch (this.httpContext.request.body.signingOut) {
            case 'yes':
                return this.redirect(ACCOUNTS_SIGNOUT_URI);
            case 'no':
                return this.redirect(returnPage);
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
}

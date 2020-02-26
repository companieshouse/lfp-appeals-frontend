import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { SUBMISSION_SUMMARY_PAGE_URI, CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { SessionMiddleware, Maybe } from 'ch-node-session-handler';
import { AppealKeys } from '../models/keys/AppealKeys';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { HttpResponseMessage } from 'inversify-express-utils/dts/httpResponseMessage';

@controller(SUBMISSION_SUMMARY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseAsyncHttpController {

    @httpGet('')
    public async renderView(req: Request): Promise<string> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        const appealsData = req.session
            .chain(_ => _.getExtraData())
            .chain(data => Maybe.fromNullable(data[AppealKeys.APPEALS_KEY]))
            .orDefault({});

        return this.render('check-your-appeal', { ...appealsData, userProfile });
    }

    @httpPost('')
    public async handleFormSubmission(): Promise<HttpResponseMessage> {
        return this.redirect(CONFIRMATION_PAGE_URI).executeAsync();
    }
}

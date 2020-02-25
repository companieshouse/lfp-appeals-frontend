import { controller, BaseHttpController, httpGet } from 'inversify-express-utils';
import { SUBMISSION_SUMMARY_PAGE_URI } from '../utils/Paths';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { SessionMiddleware } from 'ch-node-session-handler';

@controller(SUBMISSION_SUMMARY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseHttpController {

    @httpGet('')
    public renderView(req: Request): void {

        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile]);

        const appealsData = req.session
            .chain(_ => _.getExtraData())
            .map(data => {
                return {
                    penaltyIdentifier: data.appeals.penaltyIdentifier,
                    reasons: data.appeals.reasons
                };
            });

        userProfile
            .map(profile => appealsData.map(pen => {
                this.httpContext.response.render('check-your-appeal', { ...pen, profile });
            }))
            .ifNothing(() => this.httpContext.response.render('check-your-appeal', {}));

    }
}

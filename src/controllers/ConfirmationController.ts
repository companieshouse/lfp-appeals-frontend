import { SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express';
import { controller, httpGet } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { ApplicationData, APPEALS_KEY } from 'app/models/Appeal';
import { CONFIRMATION_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

@controller(CONFIRMATION_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ConfirmationController extends BaseAsyncHttpController {

    @httpGet('')
    public async getConfirmationView(req: Request): Promise<void> {

        this.checkNavigationPermissions()

        const companyNumber = req.session
            .chain(_ => _.getExtraData())
            .chainNullable<ApplicationData>(data => data[APPEALS_KEY])
            .chainNullable(appealExtraData => appealExtraData.appeal.penaltyIdentifier)
            .map(penaltyIdentifier => penaltyIdentifier.companyNumber)
            .extract();

        const userEmail = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.email)
            .extract();

        return this.render('confirmation', { companyNumber, userEmail });

    }

    private checkNavigationPermissions(): void{
        const session = this.httpContext.request.session.unsafeCoerce();
        const applicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPEALS_KEY])
            .orDefault({
                navigation: {}
            } as ApplicationData);

        console.log(applicationData);

        if(applicationData.navigation.permissions === undefined) {
            console.log('Start of journey');
            if(this.httpContext.request.url !== PENALTY_DETAILS_PAGE_URI){
                return this.httpContext.response.redirect(PENALTY_DETAILS_PAGE_URI);
            }
        } else {
            const permissions = applicationData.navigation.permissions;
            if (!applicationData.navigation.permissions.includes(this.httpContext.request.url)) {
                console.log('Redirecting, No pass to enter: ', this.httpContext.request.url);
                return this.httpContext.response.redirect(permissions[permissions.length - 1]);
            }
        }

        console.log('welcome to: ', this.httpContext.request.url);
    }
}

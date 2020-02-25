import { controller, BaseHttpController, httpGet } from 'inversify-express-utils';
import { CHECK_YOUR_APPEAL_PAGE_URI } from '../utils/Paths';

@controller(CHECK_YOUR_APPEAL_PAGE_URI)
export class CheckYourAppealController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {

        const session = this.httpContext.request.session;
        let userProfile = '';
        let reasons = '';
        let penaltyIdentifier = '';


        if(session){
            penaltyIdentifier = session.getExtraData('appeals').penaltyIdentifier;
            reasons = session.getExtraData('appeals').reasons;
            userProfile = session.getValue('signin_info').user_profile;
        }

        this.httpContext.response.render('check-your-appeal', {reasons, penaltyIdentifier, userProfile});
    }
}

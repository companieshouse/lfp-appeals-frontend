import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';
import { ROOT_URI, ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from '../utils/Paths';

@controller(ROOT_URI)
export class LandingController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {
        this.httpContext.response.render('landing', { penaltyDetailsPage: PENALTY_DETAILS_PAGE_URI });
    }

    @httpPost('')
    public continue(): void {
        return this.httpContext.response.redirect(ENTRY_PAGE_URI);
    }
}

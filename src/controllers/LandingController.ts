import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';
import { ROOT_URI, ENTRY_PAGE_URI } from '../utils/Paths';

@controller(ROOT_URI)
export class LandingController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {
        this.httpContext.response.render('landing');
    }

    @httpPost('')
    public continue(): void {
        this.httpContext.response.redirect(ENTRY_PAGE_URI);
    }
}

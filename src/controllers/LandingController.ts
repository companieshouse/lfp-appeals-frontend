import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';

import { ENTRY_PAGE_URI, ROOT_URI } from 'app/utils/Paths';

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

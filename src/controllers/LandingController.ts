import { controller, httpGet, httpPost, BaseHttpController } from 'inversify-express-utils';

import { ENTRY_PAGE_URI, LANDING, ROOT_URI } from 'app/utils/Paths';

@controller(ROOT_URI)
export class LandingController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {
        const { start } = this.httpContext.request.query;
        if (start === '0') {
            this.httpContext.response.redirect(ENTRY_PAGE_URI);
        } else {
            this.httpContext.response.render(LANDING);
        }
    }

    @httpPost('')
    public continue(): void {
        this.httpContext.response.redirect(ENTRY_PAGE_URI);
    }
}

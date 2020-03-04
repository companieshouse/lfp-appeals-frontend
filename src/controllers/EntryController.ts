import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';

import { ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

@controller(ENTRY_PAGE_URI)
export class EntryController extends BaseHttpController{

    @httpGet('')
    public redirectView(): void {
        this.httpContext.response.redirect(PENALTY_DETAILS_PAGE_URI);
    }
}

import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { PENALTY_DETAILS_PAGE_URI, ENTRY_PAGE_URI } from '../utils/Paths';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { inject } from 'inversify';

@controller(ENTRY_PAGE_URI)
export class EntryController extends BaseHttpController {

    constructor(@inject(AuthMiddleware) private readonly auth: AuthMiddleware) {
        super();
    }

    @httpGet('')
    public async redirectView(): Promise<any> {
        this.auth.setReturnURL(PENALTY_DETAILS_PAGE_URI);
        return this.redirect(PENALTY_DETAILS_PAGE_URI).executeAsync();
    }

}

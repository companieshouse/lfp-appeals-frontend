import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { PENALTY_DETAILS_PAGE_URI, ENTRY_PAGE_URI } from '../utils/Paths';

@controller(ENTRY_PAGE_URI)
export class EntryController extends BaseHttpController {

    @httpGet('')
    public async redirectView(): Promise<any> {
        return this.redirect(PENALTY_DETAILS_PAGE_URI).executeAsync();
    }

}

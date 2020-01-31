import { controller, httpGet, BaseHttpController, httpPost } from 'inversify-express-utils';
import { TYPES } from '../Types';

@controller('/penalty-reference')
export class PenaltyReferenceController extends BaseHttpController {

    constructor() {
        super();
    }

    @httpGet('/', TYPES.SessionMiddleware)
    public home(): void {
        console.log('gets');
        this.httpContext.response.render('penalty-reference');
    }

    @httpPost('/', TYPES.SessionMiddleware)
    public postData(): void {
    }

}

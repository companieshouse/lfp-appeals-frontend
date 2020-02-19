import { controller, httpGet } from 'inversify-express-utils';
import { CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';

@controller(CONFIRMATION_PAGE_URI)
export class ConfirmationController extends BaseAsyncHttpController {
    
    @httpGet('')
    public getConfirmationView() {

        const companyNumber: string = this.httpContext.request.app.locals.session.companyNumber;
        
        return this.httpContext.response.render('confirmation', { companyNumber });
    }
}
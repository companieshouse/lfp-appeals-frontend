import { controller, BaseHttpController, httpGet} from 'inversify-express-utils';
import { SUBMISSION_SUMMARY_PAGE_URI } from '../utils/Paths';

@controller(SUBMISSION_SUMMARY_PAGE_URI)
export class SubmissionSummaryController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {

        const session = this.httpContext.request.session;

        this.httpContext.response.render('submission-summary', {session});
    }
}

import { controller, BaseHttpController, httpGet} from 'inversify-express-utils';
import { SUBMISSION_SUMMARY_PAGE_URI } from '../utils/Paths';

@controller(SUBMISSION_SUMMARY_PAGE_URI)
export class SubmissionSummaryController extends BaseHttpController {

    @httpGet('')
    public renderView(): void {

        const sessionRecord: Record<string, any> = this.httpContext.request.app.locals.session

        this.httpContext.response.render('submission-summary', {
            companyNumber: sessionRecord.companyNumber,
            penaltyReference: sessionRecord.penaltyReference,
            userEmail: sessionRecord.email,
            reason: sessionRecord.reason
        });
    }
}

import { controller, BaseHttpController, httpGet} from 'inversify-express-utils';
import {SUBMISSION_SUMMARY_PAGE_URI} from '../utils/Paths';

@controller(SUBMISSION_SUMMARY_PAGE_URI)
export class SubmissionSummaryController extends BaseHttpController {
    constructor() {
        super();
    }

    @httpGet('')
    public renderView(): void {
        this.httpContext.response.render('submission-summary');
    }
}
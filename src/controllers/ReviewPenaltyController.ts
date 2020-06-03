import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { Penalty } from 'app/models/Penalty';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';

const template = 'review-penalty';
const navigation: Navigation = {
    next: () => OTHER_REASON_DISCLAIMER_PAGE_URI,
    previous: () => PENALTY_DETAILS_PAGE_URI
};

type TableColumn = {
    text: string;
};
type TableRow = TableColumn[];

@controller(REVIEW_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ReviewPenaltyController extends SafeNavigationBaseController<PenaltyIdentifier> {

    public static PENALTY_EXPECTED_ERROR: string = 'Penalty object expected but none found';

    constructor() {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & PenaltyIdentifier {

        let tableRows: TableRow[] = [];

        if (appeal.penaltyIdentifier.penalty) {
            tableRows = this.aggregatePenaltyInfo(appeal.penaltyIdentifier.penalty);
        } else {
            throw new Error(ReviewPenaltyController.PENALTY_EXPECTED_ERROR);
        }

        return {
            ...appeal.penaltyIdentifier,
            tableRows
        };
    }

    private aggregatePenaltyInfo(penalty: Penalty): TableRow[] {
        const total: number = penalty.relatedItems.reduce((p, c) => p + c.amount, 0);

        return penalty.relatedItems.map(item => {
            return [
                {
                    text: item.type.title
                },
                {
                    text: item.date
                },
                {
                    text: '£' + item.amount.toString()
                }
            ];
        }).concat([[
            {
                text: 'Total'
            },
            {
                text: ''
            },
            {
                text: '£' + total
            }
        ]]);
    }
}

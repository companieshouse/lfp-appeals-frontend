import { SessionMiddleware } from 'ch-node-session-handler';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
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
type Table = {
    caption: string,
    header: TableRow;
    madeUpToDate: string;
    tableRows: TableRow[];
};

@controller(REVIEW_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ReviewPenaltyController extends SafeNavigationBaseController<Table> {

    public static PENALTY_EXPECTED_ERROR: string = 'Penalty object expected but none found';

    constructor() {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & Table {

        if (!appeal.penaltyIdentifier.penaltyList) {
            throw new Error(ReviewPenaltyController.PENALTY_EXPECTED_ERROR);

        }
        return this.createTable(appeal.penaltyIdentifier.penaltyList);
    }

    private createTable(penalties: PenaltyList): Table {
        const penalty: Penalty = penalties.items[0];
        const madeUpToDate: string = penalty.madeUpDate;
        const caption: string = 'Penalty reference: ' + penalty.id;
        const header: TableRow = [
            {
                text: 'Fee'
            },
            {
                text: 'Date'
            },
            {
                text: 'Fee Amount'
            }
        ];
        const penaltyRow: TableRow = [
            {
                text: this.mapPenaltyType(penalty.type)
            },
            {
                text: penalty.transactionDate
            },
            {
                text: '£' + penalty.originalAmount.toString()
            }
        ];

        const totalRow: TableRow = [
            {
                text: 'Total'
            },
            {
                text: ''
            },
            {
                text: '£' + penalty.originalAmount.toString()
            }
        ];

        return {
            caption,
            header,
            madeUpToDate,
            tableRows: [penaltyRow, totalRow]
        };
    }

    private mapPenaltyType(type: string): string {
        switch(type) {
            case 'penalty':
                return 'Late Filing Penalty';
            default:
                return 'Other';
        }
    }
}
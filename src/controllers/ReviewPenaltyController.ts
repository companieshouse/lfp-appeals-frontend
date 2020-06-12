import { SessionMiddleware } from 'ch-node-session-handler';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { PenaltyDetailsTable, TableRow } from 'app/models/components/PenaltyDetailsTable';
import { OTHER_REASON_DISCLAIMER_PAGE_URI, PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

const template = 'review-penalty';

const navigation = {
    previous(): string {
        return PENALTY_DETAILS_PAGE_URI;
    },
    next(): string {
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    }
};

@controller(REVIEW_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class ReviewPenaltyController extends SafeNavigationBaseController<PenaltyDetailsTable> {

    public static PENALTY_EXPECTED_ERROR: string = 'Penalty object expected but none found';

    constructor() {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & PenaltyDetailsTable {

        if (!appeal.penaltyIdentifier.penaltyList) {
            throw new Error(ReviewPenaltyController.PENALTY_EXPECTED_ERROR);

        }
        return { ...appeal.penaltyIdentifier, ...this.createTable(appeal.penaltyIdentifier.penaltyList) };
    }

    private createTable(penalties: PenaltyList): PenaltyDetailsTable {
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
                text: 'Total:'
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

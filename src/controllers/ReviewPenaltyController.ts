import { SessionMiddleware } from 'ch-node-session-handler';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CheckForDuplicateMiddleware } from 'app/middleware/CheckForDuplicateMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { Appeal } from 'app/models/Appeal';
import { PenaltyDetailsTable, TableRow } from 'app/models/components/PenaltyDetailsTable';
import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';
import {
    CHOOSE_REASON_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    REVIEW_PENALTY_PAGE_URI,
    SELECT_THE_PENALTY_PAGE_URI
} from 'app/utils/Paths';

const template = 'review-penalty';

const navigation = {
    previous(): string {
        return `${SELECT_THE_PENALTY_PAGE_URI}?back=true`;
    },
    next(): string {
        if (isFeatureEnabled(Feature.ILLNESS_JOURNEY)) {
            return CHOOSE_REASON_PAGE_URI;
        }
        return OTHER_REASON_DISCLAIMER_PAGE_URI;
    }
};

@controller(REVIEW_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware,
    CheckForDuplicateMiddleware)
export class ReviewPenaltyController extends SafeNavigationBaseController<PenaltyDetailsTable> {

    public static PENALTY_EXPECTED_ERROR: string = 'Penalty object expected but none found';
    public static PENALTY_IDENTIFIER_EXPECTED_ERROR: string = 'User input penalty identifier expected';
    public static PENALTY_NOT_FOUND: string = 'Penalty identifier did not match any item in list of penalties expected';

    constructor() {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & PenaltyDetailsTable {

        const penaltyList = appeal.penaltyIdentifier.penaltyList;

        if (!penaltyList) {
            throw new Error(ReviewPenaltyController.PENALTY_EXPECTED_ERROR);
        }

        const penaltyReference: string | undefined = appeal.penaltyIdentifier.penaltyReference;

        if (!penaltyReference) {
            throw new Error(ReviewPenaltyController.PENALTY_IDENTIFIER_EXPECTED_ERROR);

        }

        return { ...appeal.penaltyIdentifier, ...this.createTable(penaltyReference, penaltyList) };
    }

    private createTable(penaltyReference: string, penalties: PenaltyList): PenaltyDetailsTable {
        const penalty: Penalty | undefined = penalties.items.find(item => item.id === penaltyReference);

        if (!penalty) {
            throw new Error(ReviewPenaltyController.PENALTY_NOT_FOUND);
        }

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
        switch (type) {
            case 'penalty':
                return 'Late Filing Penalty';
            default:
                return 'Other';
        }
    }
}

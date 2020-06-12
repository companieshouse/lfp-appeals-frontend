import { SessionMiddleware } from 'ch-node-session-handler';
import { PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { PenaltyReferenceRouter } from 'app/middleware/PenaltyReferenceRouter';
import { Appeal } from 'app/models/Appeal';
import { PenaltyDetailsRadioComponent } from 'app/models/components/PenaltyDetailsRadioComponent';
import { PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI, SELECT_YEAR_PAGE_URI } from 'app/utils/Paths';

const template = 'select-the-year';

const navigation = {
    previous(): string {
        return PENALTY_DETAILS_PAGE_URI;
    },
    next(): string {
        return REVIEW_PENALTY_PAGE_URI;
    }
};

@controller(SELECT_YEAR_PAGE_URI, SessionMiddleware, AuthMiddleware, PenaltyReferenceRouter)
export class SelectYearController extends SafeNavigationBaseController<any> {

    public static PENALTY_EXPECTED_ERROR: string = 'Penalty object expected but none found';

    constructor() {
        super(template, navigation);
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & any {

        const penaltyList: PenaltyList | undefined = appeal.penaltyIdentifier.penaltyList;

        if (!penaltyList || !penaltyList.items) {
            throw new Error(SelectYearController.PENALTY_EXPECTED_ERROR);
        }

        return { radioButtonComponent: PenaltyDetailsRadioComponent(penaltyList.items) };
    }
}
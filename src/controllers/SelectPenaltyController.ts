import { SessionMiddleware } from 'ch-node-session-handler';
import { PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { Request } from 'express';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';
import { FormActionProcessor } from './processors/FormActionProcessor';
import { MultiplePenaltiesValidator } from './validators/MultipePenaltiesValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { CompanyAuthMiddleware } from 'app/middleware/CompanyAuthMiddleware';
import { PenaltyReferenceRouter } from 'app/middleware/PenaltyReferenceRouter';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { createPenaltyRadioButton } from 'app/models/components/PenaltyRadioButton';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';

const template = 'select-the-penalty';

const navigation = {
    previous(): string {
        return PENALTY_DETAILS_PAGE_URI;
    },
    next(): string {
        return REVIEW_PENALTY_PAGE_URI;
    },
    actions: (_: boolean) => {
        return {
            continue:'action=continue'
        };
    }
};

@provide(Processor)
class Processor implements FormActionProcessor {
    public process(request: Request): void | Promise<void> {

        const session = request.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const appData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);

        if(!appData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        appData.appeal.penaltyIdentifier.penaltyReference = request.body.selectPenalty;

        session.setExtraData(APPLICATION_DATA_KEY, appData);
    }

}

// tslint:disable-next-line: max-classes-per-file
@controller(SELECT_THE_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware, CompanyAuthMiddleware,
    PenaltyReferenceRouter)
export class SelectPenaltyController extends SafeNavigationBaseController<any> {

    constructor() {
        super(
            template,
            navigation,
            new MultiplePenaltiesValidator(),
            undefined,
            [Processor]
        );
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & any {

        const penaltyList: PenaltyList | undefined = appeal.penaltyIdentifier.penaltyList;

        console.log('PREPARE RAN');
        if (!penaltyList || !penaltyList.items) {
            throw new Error('Penalty object expected but none found');
        }

        return { penalties: penaltyList.items.map(createPenaltyRadioButton) };
    }

}

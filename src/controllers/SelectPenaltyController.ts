import { Session, SessionMiddleware } from 'ch-node-session-handler';
import { PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';
import { FormActionHandler, FormActionHandlerConstructor } from './BaseController';
import { SafeNavigationBaseController } from './SafeNavigationBaseController';
import { FormActionProcessor } from './processors/FormActionProcessor';
import { FormValidator } from './validators/FormValidator';

import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { PenaltyReferenceRouter } from 'app/middleware/PenaltyReferenceRouter';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { createPenaltyRadioButton } from 'app/models/components/PenaltyRadioButton';
import { schema } from 'app/models/fields/PenaltyChoice.schema';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { PENALTY_DETAILS_PAGE_URI, REVIEW_PENALTY_PAGE_URI, SELECT_THE_PENALTY_PAGE_URI } from 'app/utils/Paths';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

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
@controller(SELECT_THE_PENALTY_PAGE_URI, SessionMiddleware, AuthMiddleware, PenaltyReferenceRouter)
export class SelectPenaltyController extends SafeNavigationBaseController<any> {

    constructor() {
        super(
            template,
            navigation,
            new FormValidator(schema),
            undefined,
            [Processor]
        );
    }

    public prepareViewModelFromAppeal(appeal: Appeal): Record<string, any> & any {

        const penaltyList: PenaltyList | undefined = appeal.penaltyIdentifier.penaltyList;

        if (!penaltyList || !penaltyList.items) {
            throw new Error('Penalty object expected but none found');
        }

        return { penalties: penaltyList.items.map(createPenaltyRadioButton) };
    }

    protected getExtraActionHandlers(): Record<string, FormActionHandler | FormActionHandlerConstructor> {
        const that = this;
        return {
            continue: {
                handle: async (request: Request, response: Response) => {
                    if (that.validator != null) {
                        const validationResult: ValidationResult = await that.validator.validate(request);
                        if (validationResult.errors.length > 0) {
                            return await that.renderWithStatus(UNPROCESSABLE_ENTITY)(
                                that.template,
                                {
                                    ...request.body,
                                    validationResult,
                                    ...that.prepareViewModel(),
                                    ...that.prepareNavigationConfig()
                                }
                            );
                        }
                    }

                    if (that.formActionProcessors != null) {
                        for (const actionProcessorType of that.formActionProcessors) {
                            const actionProcessor = that
                                .httpContext
                                .container
                                .get<FormActionProcessor>(actionProcessorType);
                            await actionProcessor.process(request);
                        }
                    }

                    const session: Session | undefined = request.session;

                    if (session) {
                        const applicationData: ApplicationData = session
                            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

                        session.setExtraData(APPLICATION_DATA_KEY, applicationData);

                        applicationData.appeal = that
                            .prepareSessionModelPriorSave(applicationData.appeal || {}, request.body);

                        await that.persistSession();
                    }

                    return response.redirect(that.navigation.next(request));
                }
            }
        };
    }
}

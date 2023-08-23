import { Session } from "@companieshouse/node-session-handler";
import { Request } from "express";
import { provide } from "inversify-binding-decorators";
import { RedirectResult } from "inversify-express-utils/dts/results";

import { BaseController, ChangeModeAction, FormSanitizeFunction } from "app/controllers/BaseController";
import {
    FormActionProcessor,
    FormActionProcessorConstructor
} from "app/controllers/processors/FormActionProcessor";
import { Validator } from "app/controllers/validators/Validator";
import { loggerInstance } from "app/middleware/Logger";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { PENALTY_DETAILS_PAGE_URI } from "app/utils/Paths";
import { Navigation } from "app/utils/navigation/navigation";

export type RequestWithNavigation = Request & { navigation: Navigation; };

@provide(Processor) // eslint-disable-line no-use-before-define
class Processor implements FormActionProcessor {
    process (request: RequestWithNavigation): void {
        const session = request.session;

        let applicationData: ApplicationData | undefined = session!.getExtraData(APPLICATION_DATA_KEY);

        if (!applicationData) {
            applicationData = {} as ApplicationData;
            session!.setExtraData(APPLICATION_DATA_KEY, applicationData);
        }

        const permissions = applicationData?.navigation?.permissions || [];
        const page = request.navigation.next(request);

        if (!permissions.includes(page)) {
            applicationData.navigation = {
                permissions: [...permissions, page]
            };
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
export abstract class SafeNavigationBaseController<FORM> extends BaseController<FORM> {
    protected constructor (template: string,
        navigation: Navigation,
        validator?: Validator,
        formSanitizeFunction?: FormSanitizeFunction<FORM>,
        formActionProcessors?: FormActionProcessorConstructor[],
        changeModeAction?: ChangeModeAction) {
        super(template, navigation, validator, formSanitizeFunction,
            [...formActionProcessors || [], Processor
            ], changeModeAction);
    }

    async onGet (): Promise<void | RedirectResult> {

        const session: Session | undefined = this.httpContext.request.session;

        const applicationData: ApplicationData | undefined = session!
            .getExtraData(APPLICATION_DATA_KEY) || { navigation: {} } as ApplicationData;

        if (applicationData.navigation.permissions === undefined) {
            loggerInstance()
                .info(`${SafeNavigationBaseController.name} - onGet: No navigation permissions found.`);
            if (this.httpContext.request.path !== PENALTY_DETAILS_PAGE_URI) {
                return this.redirect(PENALTY_DETAILS_PAGE_URI);
            }
        } else {
            const permissions = applicationData.navigation.permissions;
            if (!applicationData.navigation.permissions.includes(this.httpContext.request.path)) {
                loggerInstance()
                    .info(`${SafeNavigationBaseController.name} - onGet: Application did not have navigation permissions to access ${this.httpContext.request.path}.`);
                if (this.httpContext.request.path !== PENALTY_DETAILS_PAGE_URI) {
                    return this.redirect(permissions[permissions.length - 1]);
                }
            }
        }

        return super.onGet();
    }

    async onPost (): Promise<void | RedirectResult> {
        (this.httpContext.request as RequestWithNavigation).navigation = this.navigation;
        return super.onPost();
    }
}

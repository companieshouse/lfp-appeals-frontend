import { SessionMiddleware } from "@companieshouse/node-session-handler";
import { controller, httpGet } from "inversify-express-utils";

import { BaseAsyncHttpController } from "app/controllers/BaseAsyncHttpController";
import { CommonVariablesMiddleware } from "app/middleware/CommonVariablesMiddleware";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { ACCESSIBILITY_STATEMENT_URI, ROOT_URI } from "app/utils/Paths";

@controller(ACCESSIBILITY_STATEMENT_URI, SessionMiddleware, CommonVariablesMiddleware)
export class AccessibilityStatementController extends BaseAsyncHttpController {

    @httpGet("")
    public async redirectView (): Promise<void> {
        const data: ApplicationData | undefined = this.httpContext.request.session?.getExtraData(APPLICATION_DATA_KEY);
        return this.render("accessibility-statement", {
            navigation: {
                back: {
                    href: (data ? data.navigation.permissions[data.navigation.permissions.length - 1] : ROOT_URI) + "/"
                }
            }
        });
    }
}

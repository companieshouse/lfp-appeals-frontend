import { SessionMiddleware } from 'ch-node-session-handler';
import { controller, httpGet } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { Feature } from 'app/utils/Feature';
import { WHO_WAS_ILL_PAGE_URI } from 'app/utils/Paths';

const template = 'illness/who-was-ill';

@controller(WHO_WAS_ILL_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON), SessionMiddleware)
export class WhoWasIllController extends BaseAsyncHttpController {

    @httpGet('')
    public async redirectView (): Promise<void> {
        return this.render(template);
    }
}

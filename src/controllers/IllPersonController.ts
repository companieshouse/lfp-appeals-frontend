import { controller, httpGet } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';
import { Feature } from 'app/utils/Feature';
import { ILL_PERSON_PAGE_URI } from 'app/utils/Paths';

const template = 'illness/ill-person';

@controller(ILL_PERSON_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON))
export class IllPersonController extends BaseAsyncHttpController {

    @httpGet('')
    public async redirectView (): Promise<void> {
        return this.render(template);
    }
}

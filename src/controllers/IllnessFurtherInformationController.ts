import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { SessionMiddleware } from 'ch-node-session-handler';
import { controller } from 'inversify-express-utils';
import { BaseController } from './BaseController';

import { FeatureToggleMiddleware } from 'app/middleware/FeatureToggleMiddleware';

import { FURTHER_INFORMATION_PAGE_URI } from 'app/utils/Paths';
import { Navigation } from 'app/utils/navigation/navigation';
import { Feature } from 'app/utils/Feature';


const template = 'illness/further-information';

const navigation: Navigation = {
    previous(): string {
        return '';
    },
    next(): string {
        return '';
    },
    actions: (_: boolean) => {
        return {
            continue: 'action=continue'
        };
    }
};


interface FormBody{}

@controller(FURTHER_INFORMATION_PAGE_URI, FeatureToggleMiddleware(Feature.ILLNESS_REASON),
    SessionMiddleware, AuthMiddleware)
export class IllnessFurtherInformationController extends BaseController<FormBody> {
    constructor() {
        super(
            template,
            navigation,
            undefined
        );
    }
}
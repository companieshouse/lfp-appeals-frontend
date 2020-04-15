import { AccessTokenKeys } from 'ch-node-session-handler/lib/session/keys/AccessTokenKeys';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { loggerInstance } from './Logger';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
export const APPEAL_ID_QUERY_KEY = 'a';
export const COMPANY_NUMBER_QUERY_KEY = 'c';

@provide(LoadAppealMiddleware)
export class LoadAppealMiddleware extends BaseMiddleware {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
        super();
    }
    // @ts-ignore
    public async handler(req: Request, res: Response, next: NextFunction): Promise<void> {

        const applicationData = req.session.chain(_ => _.getExtraData())
            .chainNullable<ApplicationData>(extraData => extraData[APPLICATION_DATA_KEY])
            .ifNothing(() => loggerInstance().error(`${LoadAppealMiddleware.name} - Could not retrieve application data from session`))
            .unsafeCoerce();

        if (applicationData?.appeal) {
            loggerInstance().debug(`${LoadAppealMiddleware.name} - handler: user's session contains appeal`);
            return next();
        }

        const companyNumber = req.query[COMPANY_NUMBER_QUERY_KEY] as string;
        const appealId = req.query[APPEAL_ID_QUERY_KEY] as string;

        const token = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .chainNullable(signInInfo => signInInfo[SignInInfoKeys.AccessToken])
            .chainNullable(accessToken => accessToken[AccessTokenKeys.AccessToken])
            .ifNothing(() => loggerInstance().error(`${LoadAppealMiddleware.name} - Could not retrieve token from session`))
            .unsafeCoerce();

        if (appealId) {
            const appeal = await this.appealsService.getAppeal(companyNumber, appealId, token);
            applicationData.appeal = appeal;
        }

        return next();
    }

}
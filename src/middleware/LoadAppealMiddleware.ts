import { AccessTokenKeys } from 'ch-node-session-handler/lib/session/keys/AccessTokenKeys';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import makeAsyncRequestHandler from 'express-async-handler';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { loggerInstance } from './Logger';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { companyNumberSchema } from 'app/models/PenaltyIdentifier.schema';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
export const APPEAL_ID_QUERY_KEY = 'a';
export const COMPANY_NUMBER_QUERY_KEY = 'c';

@provide(LoadAppealMiddleware)
export class LoadAppealMiddleware extends BaseMiddleware {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
        super();
    }
    public handler: RequestHandler = makeAsyncRequestHandler(
        // @ts-ignore
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {

            const companyNumber = req.query[COMPANY_NUMBER_QUERY_KEY] as string;
            const appealId = req.query[APPEAL_ID_QUERY_KEY] as string;

            const session = req.session.unsafeCoerce();

            const applicationData = session.getExtraData()
                .chainNullable<ApplicationData>(extraData => extraData[APPLICATION_DATA_KEY])
                .ifNothing(() => session.saveExtraData(APPLICATION_DATA_KEY, {}))
                .orDefault({} as ApplicationData);

            try {
                new SchemaValidator(companyNumberSchema).validate(companyNumber);
            } catch (err) {
                throw new Error('Tried to load appeal from an invalid company number');
            }

            const accessTokenMaybe = req.session
                .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
                .chainNullable(signInInfo => signInInfo[SignInInfoKeys.AccessToken]);

            const accessToken: string = accessTokenMaybe
                .chainNullable(accessTokenNode => accessTokenNode[AccessTokenKeys.AccessToken])
                .ifNothing(() => loggerInstance().error(`${LoadAppealMiddleware.name} - Could not retrieve token from session`))
                .unsafeCoerce();

            const refreshToken: string = accessTokenMaybe
                .chainNullable(accessTokenNode => accessTokenNode[AccessTokenKeys.RefreshToken])
                .ifNothing(() => loggerInstance().error(`${LoadAppealMiddleware.name} - Could not retrieve access token from session`))
                .unsafeCoerce();

            if (appealId) {
                const appeal = await this.appealsService.getAppeal(companyNumber, appealId, accessToken, refreshToken);
                applicationData!.appeal = appeal;
                session.saveExtraData(APPLICATION_DATA_KEY, applicationData);
            }

            return next();
        }
    );

}

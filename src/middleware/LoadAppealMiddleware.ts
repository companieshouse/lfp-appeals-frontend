import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
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

            const session: Session | undefined = req.session;

            let applicationData: ApplicationData | undefined = session!.getExtraData(APPLICATION_DATA_KEY);

            if (!applicationData) {
                applicationData = {} as ApplicationData;
                session!.setExtraData(APPLICATION_DATA_KEY, applicationData);
            }

            try {
                new SchemaValidator(companyNumberSchema).validate(companyNumber);
            } catch (err) {
                throw new Error('Tried to load appeal from an invalid company number');
            }

            const signInInfo: ISignInInfo | undefined = session!.get<ISignInInfo>(SessionKey.SignInInfo);

            const token: string | undefined = signInInfo?.access_token?.access_token;

            if (!token){
                loggerInstance().error(`${LoadAppealMiddleware.name} - Could not retrieve token from session`);
            }

            if (appealId) {

                applicationData!.appeal = await this.appealsService.getAppeal(companyNumber, appealId, token!);
                session!.setExtraData(APPLICATION_DATA_KEY, applicationData);
            }

            return next();
        }
    );

}

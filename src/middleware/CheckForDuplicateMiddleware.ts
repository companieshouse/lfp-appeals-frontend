import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { TOKEN_MISSING_ERROR } from 'app/utils/CommonErrors';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const errorCustomTemplate: string = 'error-custom';
const enquiryEmail: string = getEnvOrThrow('ENQUIRY_EMAIL');

const customErrorHeading: string = 'An Appeal has already been submitted for this penalty';
const customErrorMessage: string = `If you think this is a mistake, email ${enquiryEmail}.`;

@provide(CheckForDuplicateMiddleware)
export class CheckForDuplicateMiddleware extends BaseMiddleware {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
        super();
    }

    public async handler(request: Request, response: Response, next: NextFunction): Promise<void> {

        if (!request.session) {
            return next(new Error('Session is undefined'));
        }

        const signInInfo: ISignInInfo | undefined = request.session.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const refreshToken: string | undefined = signInInfo?.access_token?.refresh_token;

        if (!accessToken) {
            return next(TOKEN_MISSING_ERROR);
        }

        const applicationData: ApplicationData = request.session
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const companyNumber: string = applicationData.appeal.penaltyIdentifier.companyNumber;
        const penaltyReference: string = applicationData.appeal.penaltyIdentifier.penaltyReference;

        loggerInstance()
            .info(`CheckForDuplicateMiddleware - Checking penalty ${penaltyReference} for duplicate appeals`);

        try {
            const isDuplicate: boolean = await this.appealsService
                .hasExistingAppeal(companyNumber, penaltyReference, accessToken, refreshToken!);

            if (isDuplicate) {
                loggerInstance().error(`CheckForDuplicateMiddleware - Duplicate appeal found for company ${companyNumber} and reference ${penaltyReference}`);
                return response.status(UNPROCESSABLE_ENTITY).render(errorCustomTemplate, {
                    heading: customErrorHeading,
                    message: customErrorMessage
                });
            }
        } catch (err) {
            return next(err);
        }

        loggerInstance().debug(`CheckForDuplicateMiddleware - No appeal found for company ${companyNumber} and reference ${penaltyReference}`);
        return next();
    }
}

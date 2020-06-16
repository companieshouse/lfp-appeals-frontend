import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import makeAsyncRequestHandler from 'express-async-handler';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';

const errorCustomTemplate: string = 'error-custom';
const enquiryEmail: string = 'enquiries@companieshouse.gov.uk';

const customErrorHeading = 'An Appeal has already been submitted for this penalty';
const customErrorMessage = `If you think this is a mistake, email ${enquiryEmail}.`;

@provide(CheckForDuplicateMiddleware)
export class CheckForDuplicateMiddleware extends BaseMiddleware {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
        super();
    }

    public handler: RequestHandler = makeAsyncRequestHandler(

        async (request: Request, response: Response, next: NextFunction): Promise<void> => {

        if (!request.session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = request.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const refreshToken: string | undefined = signInInfo?.access_token?.refresh_token;

        if (!accessToken) {
            throw TOKEN_MISSING_ERROR;
        }

        const applicationData: ApplicationData = request.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const companyNumber: string = sanitizeCompany(applicationData.appeal.penaltyIdentifier.companyNumber);
        const penaltyReference: string = applicationData.appeal.penaltyIdentifier.penaltyReference.toUpperCase();

        loggerInstance()
            .info(`CheckForDuplicateProcessor - Checking penalty ${penaltyReference} for duplicate appeals`);

        const isDuplicate = await this
            .appealsService.isDuplicateAppeal(companyNumber, penaltyReference, accessToken, refreshToken!);

        console.log(isDuplicate);

        if (isDuplicate) {
            loggerInstance().error(`CheckForDuplicateProcessor - Duplicate appeal found for company ${companyNumber} and reference ${penaltyReference}`);
            return response.render(errorCustomTemplate, {
                heading: customErrorHeading,
                message: customErrorMessage
            });
        }

        loggerInstance().debug(`CheckForDuplicateProcessor - No appeal found for company ${companyNumber} and reference ${penaltyReference}`);
        return next();
    });
}

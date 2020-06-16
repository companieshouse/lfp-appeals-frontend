import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

@provide(FileTransferFeatureMiddleware)
export class FileTransferFeatureMiddleware extends BaseMiddleware {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
        super();}

    public async handler(request: Request, response: Response, next: NextFunction): Promise<void> {
        if (request.url === PENALTY_DETAILS_PAGE_URI) {

            if (!request.session) {
                throw new Error('Session is undefined');
            }

            const signInInfo: ISignInInfo | undefined = request.session!.get<ISignInInfo>(SessionKey.SignInInfo);

            const accessToken: string | undefined = signInInfo?.access_token?.access_token;

            const refreshToken: string | undefined = signInInfo?.access_token?.refresh_token;

            if (!accessToken) {
                throw TOKEN_MISSING_ERROR;
            }

            const penaltyIdentifier: PenaltyIdentifier = request.body;
            const companyNumber: string = sanitizeCompany(penaltyIdentifier!.companyNumber);
            const penaltyReference: string = penaltyIdentifier!.penaltyReference.toUpperCase();

            loggerInstance()
                .info(`CheckForDuplicateProcessor - Checking penalty ${penaltyReference} for duplicate appeals`);

            const isDuplicate = await this
                .appealsService.isDuplicateAppeal(companyNumber, penaltyReference, accessToken, refreshToken!);

            if (isDuplicate) {
                loggerInstance().error(`CheckForDuplicateProcessor - Duplicate appeal found for company ${companyNumber} and reference ${penaltyReference}`);
                response.render('custom-error');
            }

            loggerInstance().debug(`CheckForDuplicateProcessor - No appeal found for company ${companyNumber} and reference ${penaltyReference}`);
            return;
        }
    }
}

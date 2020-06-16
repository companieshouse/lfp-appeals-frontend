import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';

// const errorCustomTemplate: string = 'error-custom';
// const enquiryEmail: string = 'enquiries@companieshouse.gov.uk';

@provide(CheckForDuplicateProcessor)
export class CheckForDuplicateProcessor implements FormActionProcessor {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {}

    public async process(request: Request): Promise<void> {

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

        const isDuplicate = await this.appealsService
            .isDuplicateAppeal(companyNumber, penaltyReference, accessToken, refreshToken!);

        if (isDuplicate){
            loggerInstance().error(`CheckForDuplicateProcessor - Duplicate appeal found for company ${companyNumber} and reference ${penaltyReference}`);
            throw new Error('custom error page should go here');
        }

        loggerInstance().debug(`CheckForDuplicateProcessor - No appeal found for company ${companyNumber} and reference ${penaltyReference}`);
        return;
    }
}

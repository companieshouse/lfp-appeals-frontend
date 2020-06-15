import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { NOT_FOUND } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';

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

        const penaltyIdentifier: PenaltyIdentifier | undefined = request.body;
        const companyNumber: string = penaltyIdentifier!.companyNumber;
        const penaltyReference: string = penaltyIdentifier!.penaltyReference;

        loggerInstance().debug(`CheckForDuplicateProcessor - Checking penalty ${penaltyReference}`);

        try{
            await this.appealsService.getAppealByPenalty(companyNumber, penaltyReference, accessToken, refreshToken!);
        } catch (err) {
            if (err.statusCode === NOT_FOUND){
                loggerInstance().debug(`CheckForDuplicateProcessor - duplicate appeal not found`);
            } else {
                throw new Error(err.message);
            }
        }

        return;
    }
}

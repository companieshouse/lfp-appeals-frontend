
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { createApiClient } from 'ch-sdk-node';
import { Request } from 'express';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

@provide(AppealDetailActionProcessor)
export class AppealDetailActionProcessor implements FormActionProcessor {

    async process(request: Request): Promise<void> {

        const API_URL = getEnvOrThrow(`API_URL`);

        if (!request.session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = request.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const companyNumber: string = (request.body as PenaltyIdentifier).companyNumber;

        try {
            const api = createApiClient(undefined, accessToken, API_URL);
            const penalties = await api.lateFilingPenalties.getPenalties(companyNumber);

            if (penalties.httpStatusCode !== 200){
                loggerInstance().error(`AppealDetailActionProcessor: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken} and base url ${API_URL}`);
            }

        } catch (err) {
            loggerInstance().error(`AppealDetailProcessor: Failed to communicate with pay API: ${err}`);
        }

    }
}

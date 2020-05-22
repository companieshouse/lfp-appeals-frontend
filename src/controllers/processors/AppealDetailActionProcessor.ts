
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import {createApiClient} from 'ch-sdk-node';
import { Request } from 'express';
import { OK } from 'http-status-codes';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

@provide(AppealDetailActionProcessor)
export class AppealDetailActionProcessor implements FormActionProcessor {

    async process(request: Request): Promise<void> {

        if (!request.session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = request.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const body: PenaltyIdentifier = request.body;

        const companyNumber: string = body.companyNumber;

        const API_URL = getEnvOrThrow(`LFP_PAY_API_URL`);

        try{
            const api = createApiClient(undefined, accessToken, API_URL);
            const penalties = await api.lateFilingPenalties.getPenalties(companyNumber);
            if (penalties.httpStatusCode !== OK){
                loggerInstance().error(`AppealDetailActionProcessor: failed to get penalties from PAY API  with status code ${penalties.httpStatusCode} with access token ${accessToken} and url ${API_URL}`);
            } else{
                loggerInstance().debug(`AppealDetailProcessor: got penalties from ${companyNumber} access token ${accessToken} and url ${API_URL}`);
            }
        } catch (err) {
            loggerInstance().error(`Failed to get penalties for ${companyNumber}: ${err}`);
        }


    }
}

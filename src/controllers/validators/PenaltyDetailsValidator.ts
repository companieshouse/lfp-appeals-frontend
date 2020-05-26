import { AnySchema } from '@hapi/joi';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { createApiClient } from 'ch-sdk-node';
import { Request } from 'express';

import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class PenaltyDetailsValidator implements Validator {
    constructor(private readonly formSchema: AnySchema) {
    }

    async validate(request: Request): Promise<ValidationResult> {
        const schemaResults: ValidationResult = new SchemaValidator(this.formSchema).validate(request.body);

        if (schemaResults.errors.length > 0) {
            return schemaResults;
        }

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
            if (penalties.httpStatusCode !== 200) {
                loggerInstance().error(`AppealDetailActionProcessor: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken} and base url ${API_URL}`);
            }
        } catch (err) {
            loggerInstance().error(err);
            return new ValidationResult([
                new ValidationError('companyNumber', 'Penalty not found, check that the company number and penalty reference are correct'),
                new ValidationError('penaltyReference', '')
            ]);
        }

        return new ValidationResult([]);

    }
}

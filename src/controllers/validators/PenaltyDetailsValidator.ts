import { AnySchema } from '@hapi/joi';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { PenaltyList } from 'ch-sdk-node/dist/services/lfp/types';
import Resource from 'ch-sdk-node/dist/services/resource';
import { Request } from 'express';
import { OK } from 'http-status-codes';

import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

export class PenaltyDetailsValidator implements Validator {
    constructor(private readonly formSchema: AnySchema,
                private readonly chSdk: CompaniesHouseSDK) {}


    private createValidationResultWithErrors(): ValidationResult {
        return new ValidationResult([
            new ValidationError('companyNumber', 'Check that you’ve entered the correct company number'),
            new ValidationError('penaltyReference', 'Check that you’ve entered the correct reference number')
        ]);
    }

    async validate(request: Request): Promise<ValidationResult> {
        const API_URL = getEnvOrThrow(`APPEALS_API_URL`);

        const schemaResults: ValidationResult = new SchemaValidator(this.formSchema).validate(request.body);

        if (schemaResults.errors.length > 0) {
            return schemaResults;
        }

        if (!request.session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = request.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const companyNumber: string = (request.body as PenaltyIdentifier).companyNumber;

        const penaltyReference: string = (request.body as PenaltyIdentifier).penaltyReference;

        try {

            const penalties: Resource<PenaltyList> =
                await this.chSdk(new OAuth2(accessToken!)).lateFilingPenalties.getPenalties(companyNumber);

            if (penalties.httpStatusCode !== OK) {
                throw new Error(`AppealDetailActionProcessor: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken} and base url ${API_URL}`);
            }

            const items = penalties.resource!.items
                .filter(penalty =>
                    penalty.type === 'penalty' &&
                    penalty.id === penaltyReference
                );

            if (!items || items.length === 0) {
                loggerInstance().error(`No penalties for ${companyNumber} match the reference number ${penaltyReference}`);
                return this.createValidationResultWithErrors();
            }

        } catch (err) {
            if (err.message === 'Cannot read property \'map\' of null') {
                loggerInstance().error(`company number ${companyNumber} could not be found: ${err}`);
                return this.createValidationResultWithErrors();
            }

            throw new Error(`Can't access API: ${err}`);
        }

        return new ValidationResult([]);

    }
}

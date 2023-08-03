import { Penalty, PenaltyList } from '@companieshouse/api-sdk-node/dist/services/lfp/types';
import Resource from '@companieshouse/api-sdk-node/dist/services/resource';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { PenaltyIdentifierSchemaFactory } from 'app/models/PenaltyIdentifierSchemaFactory';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';
import { getPenaltiesItems } from 'app/utils/appeal/extra.data';
import { getAccessToken } from 'app/utils/session/session';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

@provide(PenaltyDetailsValidator)
export class PenaltyDetailsValidator implements Validator {

    public static COMPANY_NUMBER_VALIDATION_ERROR: ValidationError = new ValidationError('companyNumber', 'You must enter your full eight character company number');
    public static PENALTY_REFERENCE_VALIDATION_ERROR: ValidationError = new ValidationError('userInputPenaltyReference', 'You must enter your reference number exactly as shown on your penalty notice');
    public static MULTIPLE_PENALTIES_FOUND_ERROR: Error = new Error(`Multiple penalties found. This is currently unsupported`);
    constructor(
        @inject(CompaniesHouseSDK) readonly chSdk: CompaniesHouseSDK,
        @inject(PenaltyIdentifierSchemaFactory) private readonly schemaFactory: PenaltyIdentifierSchemaFactory
    ) { }

    private createValidationResultWithErrors(): ValidationResult {
        return new ValidationResult([
            PenaltyDetailsValidator.COMPANY_NUMBER_VALIDATION_ERROR,
            PenaltyDetailsValidator.PENALTY_REFERENCE_VALIDATION_ERROR
        ]);
    }

    async validate(request: Request): Promise<ValidationResult> {

        const schemaResults: ValidationResult = new SchemaValidator(this.schemaFactory.getPenaltyIdentifierSchema())
            .validate(request.body);

        if (schemaResults.errors.length > 0) {
            return schemaResults;
        }

        const accessToken: string = getAccessToken(request.session);
        const companyNumber: string = (request.body as PenaltyIdentifier).companyNumber;
        const sanitizedCompanyNumber: string = sanitizeCompany(companyNumber);
        const penaltyReference: string = (request.body as PenaltyIdentifier).userInputPenaltyReference;

        const mapErrorMessage = 'Cannot read property \'map\' of null';
        const etagErrorMessage = 'Cannot read property \'etag\' of null';

        try {

            const penalties: Resource<PenaltyList> =
                await this.chSdk(new OAuth2(accessToken))
                    .lateFilingPenalties.getPenalties(sanitizedCompanyNumber);

            const filteredPenaltiesItems: Penalty[] = getPenaltiesItems(
                request.session!,
                accessToken,
                penalties
            );

            if (!filteredPenaltiesItems || filteredPenaltiesItems.length === 0) {
                loggerInstance().error(`${PenaltyDetailsValidator.name}: No penalties for ${sanitizedCompanyNumber} match the reference number ${penaltyReference}`);
                return this.createValidationResultWithErrors();
            }

            penalties.resource!.items = filteredPenaltiesItems;
            request.body.penaltyList = penalties.resource;

        } catch (err) {
            if (err.message === mapErrorMessage || err.message === etagErrorMessage) {
                loggerInstance().error(`${PenaltyDetailsValidator.name}: company number ${companyNumber} could not be found: ${err}`);
                return this.createValidationResultWithErrors();
            }

            if (err.message === PenaltyDetailsValidator.MULTIPLE_PENALTIES_FOUND_ERROR.message) {
                throw err;
            }

            throw new Error(`Can't access API: ${err}`);
        }

        return new ValidationResult([]);

    }
}

import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp/types';
import Resource from 'ch-sdk-node/dist/services/resource';
import { Request } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import moment from 'moment';

import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { schema } from 'app/models/PenaltyIdentifier.schema';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';
import { ValidationError } from 'app/utils/validation/ValidationError';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

@provide(PenaltyDetailsValidator)
export class PenaltyDetailsValidator implements Validator {

    public static COMPANY_NUMBER_VALIDATION_ERROR: ValidationError = new ValidationError('companyNumber', 'Check that you’ve entered the correct company number');
    public static PENALTY_REFERENCE_VALIDATION_ERROR: ValidationError = new ValidationError('penaltyReference', 'Check that you’ve entered the correct reference number');
    public static MULTIPLE_PENALTIES_FOUND_ERROR: Error = new Error(`Multiple penalties found. This is currently unsupported`);
    constructor(@inject(CompaniesHouseSDK) readonly chSdk: CompaniesHouseSDK) { }


    private createValidationResultWithErrors(): ValidationResult {
        return new ValidationResult([
            PenaltyDetailsValidator.COMPANY_NUMBER_VALIDATION_ERROR,
            PenaltyDetailsValidator.PENALTY_REFERENCE_VALIDATION_ERROR
        ]);
    }

    async validate(request: Request): Promise<ValidationResult> {

        const schemaResults: ValidationResult = new SchemaValidator(schema).validate(request.body);
        if (schemaResults.errors.length > 0) {
            return schemaResults;
        }

        if (!request.session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const signInInfo: ISignInInfo | undefined = request.session.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        if (!accessToken) {
            throw TOKEN_MISSING_ERROR;
        }

        const companyNumber: string = (request.body as PenaltyIdentifier).companyNumber;

        const penaltyReference: string = (request.body as PenaltyIdentifier).penaltyReference;

        const mapErrorMessage = 'Cannot read property \'map\' of null';
        const etagErrorMessage = 'Cannot read property \'etag\' of null';

        try {

            const modernPenaltyReferenceRegex: RegExp = /^([A-Z][0-9]{7}|[0-9]{9})$/;

            const penalties: Resource<PenaltyList> =
                await this.chSdk(new OAuth2(accessToken)).lateFilingPenalties.getPenalties(companyNumber);

            if (penalties.httpStatusCode !== OK || !penalties.resource) {
                throw new Error(`PenaltyDetailsValidator: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken}`);
            }

            let items: Penalty[] = penalties.resource.items.filter(penalty => penalty.type === 'penalty');

            if (modernPenaltyReferenceRegex.test(penaltyReference)) {
                items = items.filter(penalty => penalty.id === penaltyReference);
                penalties.resource.items = items;
                loggerInstance().info(`${PenaltyDetailsValidator.name}: ${JSON.stringify(request.body)}`);
            }

            if (!items || items.length === 0) {
                loggerInstance().error(`${PenaltyDetailsValidator.name}: No penalties for ${companyNumber} match the reference number ${penaltyReference}`);
                return this.createValidationResultWithErrors();
            }

            if (items.length > 1) {
                loggerInstance().error(`${PenaltyDetailsValidator.name}: Multiple penalties found. This is currently unsupported`);
                throw PenaltyDetailsValidator.MULTIPLE_PENALTIES_FOUND_ERROR;
            }

            request.body.penaltyReference = penalties.resource.items[0].id;

            penalties.resource.items = penalties.resource.items.map(item => {
                item.madeUpDate = moment(item.madeUpDate).format('D MMMM YYYY');
                item.transactionDate = moment(item.transactionDate).format('D MMMM YYYY');
                return item;
            });

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

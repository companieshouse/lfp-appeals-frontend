import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp/types';
import Resource from 'ch-sdk-node/dist/services/resource';
import { Request } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import moment from 'moment';

import { Validator } from 'app/controllers/validators/Validator';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { PenaltyIdentifierSchemaFactory } from 'app/models/PenaltyIdentifierSchemaFactory';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from 'app/utils/CommonErrors';
import { sanitizeCompany } from 'app/utils/CompanyNumberSanitizer';
import { REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';
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

        const session: Session | undefined = request.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const appData: ApplicationData = session.getExtraData<ApplicationData>(APPLICATION_DATA_KEY)
            || { appeal: {} as Appeal, navigation: { permissions: [] } } as ApplicationData;

        const signInInfo: ISignInInfo | undefined = session.get<ISignInInfo>(SessionKey.SignInInfo);

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        if (!accessToken) {
            throw TOKEN_MISSING_ERROR;
        }

        const companyNumber: string = (request.body as PenaltyIdentifier).companyNumber;

        const sanitizedCompanyNumber: string = sanitizeCompany(companyNumber);

        const penaltyReference: string = (request.body as PenaltyIdentifier).userInputPenaltyReference;

        const mapErrorMessage = 'Cannot read property \'map\' of null';
        const etagErrorMessage = 'Cannot read property \'etag\' of null';

        try {

            const modernPenaltyReferenceRegex: RegExp = /^([A-Z][0-9]{7}|[0-9]{9})$/;

            const penalties: Resource<PenaltyList> =
                await this.chSdk(new OAuth2(accessToken))
                    .lateFilingPenalties.getPenalties(sanitizedCompanyNumber);

            if (penalties.httpStatusCode !== OK || !penalties.resource) {
                throw new Error(`PenaltyDetailsValidator: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken}`);
            }

            let items: Penalty[] = penalties.resource.items.filter(penalty => penalty.type === 'penalty');

            if (modernPenaltyReferenceRegex.test(penaltyReference)) {
                items = items.filter(penalty => penalty.id === penaltyReference);
                loggerInstance().info(`${PenaltyDetailsValidator.name}: ${JSON.stringify(request.body)}`);
            }

            if (!items || items.length === 0) {
                loggerInstance().error(`${PenaltyDetailsValidator.name}: No penalties for ${sanitizedCompanyNumber} match the reference number ${penaltyReference}`);
                return this.createValidationResultWithErrors();
            }

            if (items.length === 1) {
                appData.navigation.permissions.push(REVIEW_PENALTY_PAGE_URI);
                session.setExtraData(APPLICATION_DATA_KEY, appData);
            }

            items = items.map(item => {
                item.madeUpDate = moment(item.madeUpDate).format('D MMMM YYYY');
                item.transactionDate = moment(item.transactionDate).format('D MMMM YYYY');
                return item;
            });

            penalties.resource.items = items;

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

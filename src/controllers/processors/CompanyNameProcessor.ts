import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types';
import Resource from 'ch-sdk-node/dist/services/resource';
import { Request } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { FormActionProcessor } from './FormActionProcessor';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';


export const SESSION_NOT_FOUND_ERROR: Error = new Error('Session Expected but was undefined');
export const TOKEN_MISSING_ERROR: Error = new Error('Token was expected');
export const COMPANY_NUMBER_UNDEFINED_ERROR: Error = new Error('Company number expected but was undefined');
export const COMPANY_NUMBER_RETRIEVAL_ERROR = (companyNumber: string) => Error(`Could not retrieve company name for ${companyNumber}`);

@provide(CompanyNameProcessor)
export class CompanyNameProcessor implements FormActionProcessor {

    constructor(@inject(CompaniesHouseSDK) private readonly chSdk: CompaniesHouseSDK) {

    }
    public async process(request: Request): Promise<void> {

        const session = request?.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const token: string | undefined = session.get<ISignInInfo>(SessionKey.SignInInfo)?.access_token?.access_token;

        if (!token) {
            throw TOKEN_MISSING_ERROR;
        }

        const applicationData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);
        const companyNumber: string | undefined = applicationData?.appeal.penaltyIdentifier.companyNumber;

        if (!companyNumber) {
            throw COMPANY_NUMBER_UNDEFINED_ERROR;
        }

        const profile: Resource<CompanyProfile> = await this
            .chSdk(OAuth2(token))
            .companyProfile.getCompanyProfile(companyNumber);

        const companyName = profile.resource?.companyName;

        if (profile.httpStatusCode !== OK || !companyName) {
            throw COMPANY_NUMBER_RETRIEVAL_ERROR(companyNumber);
        }

        applicationData!.appeal.penaltyIdentifier.companyName = companyName;
    }

}
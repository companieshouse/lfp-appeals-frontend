import { CompanyProfile } from "@companieshouse/api-sdk-node/dist/services/company-profile/types";
import Resource from "@companieshouse/api-sdk-node/dist/services/resource";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import { Request } from "express";
import { OK } from "http-status-codes";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import { FormActionProcessor } from "./FormActionProcessor";

import { PenaltyIdentifier } from "app/models/PenaltyIdentifier";
import { CompaniesHouseSDKFactoryType, OAuth2, CompaniesHouseSDK } from "app/modules/Types";
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from "app/utils/CommonErrors";
import { sanitizeCompany } from "app/utils/CompanyNumberSanitizer";

export const COMPANY_NUMBER_UNDEFINED_ERROR: Error = new Error("Company number expected but was undefined");
export const COMPANY_NAME_RETRIEVAL_ERROR = (companyNumber: string) => Error(`Could not retrieve company name for ${companyNumber}`);

@provide(CompanyNameProcessor) // eslint-disable-line no-use-before-define
export class CompanyNameProcessor implements FormActionProcessor {

    constructor (@inject(CompaniesHouseSDK) private readonly chSdk: CompaniesHouseSDKFactoryType) { }

    public async process (request: Request): Promise<void> {

        const session = request?.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const token: string | undefined = session.get<ISignInInfo>(SessionKey.SignInInfo)?.access_token?.access_token;

        if (!token) {
            throw TOKEN_MISSING_ERROR;
        }

        const penaltyIdentifier: PenaltyIdentifier | undefined = request.body;
        const companyNumber: string | undefined = penaltyIdentifier?.companyNumber;

        if (!companyNumber) {
            throw COMPANY_NUMBER_UNDEFINED_ERROR;
        }

        const sanitizedCompanyNumber: string = sanitizeCompany(companyNumber);

        const profile: Resource<CompanyProfile> = await this
            .chSdk(new OAuth2(token))
            .companyProfile.getCompanyProfile(sanitizedCompanyNumber);

        const companyName: string | undefined = profile.resource?.companyName;

        if (profile.httpStatusCode !== OK || !companyName) {
            throw COMPANY_NAME_RETRIEVAL_ERROR(sanitizedCompanyNumber);
        }

        request.body.companyName = companyName;
    }

}

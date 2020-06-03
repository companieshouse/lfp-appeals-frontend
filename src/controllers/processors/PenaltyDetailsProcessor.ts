import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import Resource from 'ch-sdk-node/dist/services/resource';
import { Request } from 'express';
import { OK } from 'http-status-codes';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { COMPANY_NUMBER_UNDEFINED_ERROR } from './CompanyNameProcessor';
import { FormActionProcessor } from './FormActionProcessor';
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from './errors/Errors';

import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { CompaniesHouseSDK, OAuth2 } from 'app/modules/Types';

export const PENALTY_NOT_FOUND_ERROR = new Error('Penalty details not found');

@provide(PenaltyDetailsProcessor)
export class PenaltyDetailsProcessor implements FormActionProcessor {
    constructor(@inject(CompaniesHouseSDK) private readonly chSdk: CompaniesHouseSDK) { }
    public async process(request: Request): Promise<void> {
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

        const penalties: Resource<PenaltyList> = await this
            .chSdk(new OAuth2(token))
            .lateFilingPenalties
            .getPenalties(companyNumber);

        console.log(penalties);

        if (penalties.httpStatusCode !== OK) {
            throw PENALTY_NOT_FOUND_ERROR;
        }

    }
}
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import CompanyAuthConfig from 'app/models/CompanyAuthConfig';
import JwtEncryptionService from 'app/modules/jwt-encryption-service/jwtEncryptionService';
import jwtEncryptionService from 'app/modules/jwt-encryption-service/jwtEncryptionService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const OATH_SCOPE_PREFIX = 'https://api.companieshouse.gov.uk/company/';

@provide(CompanyAuthMiddleware)
export class CompanyAuthMiddleware extends BaseMiddleware {

    public handler: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        if (!req.session) {
            return next(new Error('Session is undefined'));
        }

        const applicationData: ApplicationData = req.session
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const companyNumber: string = applicationData.appeal.penaltyIdentifier.companyNumber;

        const companyAuthConfig: CompanyAuthConfig = {
            accountUrl: getEnvOrThrow('ACCOUNT_WEB_URL'),
            accountRequestKey: getEnvOrThrow('OAUTH2_REQUEST_KEY'),
            accountClientId: getEnvOrThrow('OAUTH2_CLIENT_ID'),
            chsUrl: getEnvOrThrow('CHS_URL'),
        };

        const encryptionService = new jwtEncryptionService(companyAuthConfig);
        return res.redirect(await getAuthRedirectUri(req, companyAuthConfig, encryptionService, companyNumber));
    }

}

async function getAuthRedirectUri(req: Request, companyAuthConfig: CompanyAuthConfig,
                                  encryptionService: JwtEncryptionService,
                                  companyNumber?: string): Promise<string> {

    const originalUrl: string = req.originalUrl;
    const scope: string = OATH_SCOPE_PREFIX + companyNumber;
    const nonce: string = encryptionService.generateNonce();
    const encodedNonce: string = await encryptionService.jweEncodeWithNonce(originalUrl, nonce);

    // sessionService.setCompanyAuthNonce(req, nonce);

    return await createAuthUri(encodedNonce, companyAuthConfig, scope);
}

async function createAuthUri(encodedNonce: string,
                             companyAuthConfig: CompanyAuthConfig, scope: string): Promise<string> {
    return `${companyAuthConfig.accountUrl}/oauth2/authorise`.concat(
        '?',
        `client_id=${companyAuthConfig.accountClientId}`,
        `&redirect_uri=${companyAuthConfig.chsUrl}/oauth2/user/callback`,
        `&response_type=code`,
        `&scope=${scope}`,
        `&state=${encodedNonce}`);
}

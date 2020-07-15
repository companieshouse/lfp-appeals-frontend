
import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';

import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import CompanyAuthConfig from 'app/models/CompanyAuthConfig';
import { Mutable } from 'app/models/Mutable';
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
            accountUrl: 'http://account.chs.local',
            accountRequestKey: getEnvOrThrow('OAUTH2_REQUEST_KEY'),
            accountClientId: getEnvOrThrow('OAUTH2_CLIENT_ID'),
            chsUrl: 'http://chs.local'
        };

        const encryptionService = new jwtEncryptionService(companyAuthConfig);

        try {

            const uri = await getAuthRedirectUri(req, companyAuthConfig, encryptionService, companyNumber);
            loggerInstance().debug(`Redirecting to ${uri}`);
            return res.redirect(uri);

        } catch (err){
            next(err);
        }

    }
}

async function getAuthRedirectUri(req: Request, companyAuthConfig: CompanyAuthConfig,
                                  encryptionService: JwtEncryptionService,
                                  companyNumber?: string): Promise<string> {

    const originalUrl: string = req.originalUrl;
    console.log(req.originalUrl);
    const scope: string = OATH_SCOPE_PREFIX + companyNumber;
    const nonce: string = encryptionService.generateNonce();

    const encodedNonce: string = await encryptionService.jweEncodeWithNonce(originalUrl, nonce);

    const mutableSession = req.session as Mutable<Session>;
    mutableSession.data[SessionKey.OAuth2Nonce] = nonce;
    req.session = mutableSession as Session;

    return createAuthUri(encodedNonce, companyAuthConfig, scope);
}

function createAuthUri(encodedNonce: string, companyAuthConfig: CompanyAuthConfig, scope: string): string {

    return `${companyAuthConfig.accountUrl}/oauth2/authorise`.concat(
        '?',
        `client_id=${companyAuthConfig.accountClientId}`,
        `&redirect_uri=${companyAuthConfig.chsUrl}/oauth2/user/callback`,
        `&response_type=code`,
        `&scope=${scope}`,
        `&state=${encodedNonce}`);
}

import { Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request, Response } from 'express';
import { injectable, unmanaged } from 'inversify';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const sessionCookieName = getEnvOrThrow('COOKIE_NAME');
const sessionCookieDomain = getEnvOrThrow('COOKIE_DOMAIN');
const sessionCookieSecureFlag = getEnvOrDefault('COOKIE_SECURE_ONLY', 'true');
const sessionCookieSecret = getEnvOrThrow('COOKIE_SECRET');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10);

@injectable()
export abstract class UpdateSessionFormSubmissionProcessor<MODEL> implements FormSubmissionProcessor {
    protected constructor(@unmanaged() readonly sessionStore: SessionStore) {}

    async process(req: Request, res: Response): Promise<void> {
        await this.updateSession(req.session.unsafeCoerce(), req.body);
        res.cookie(sessionCookieName, req.cookies[sessionCookieName], {
            domain: sessionCookieDomain,
            path: '/',
            httpOnly: true,
            secure: sessionCookieSecureFlag === 'true',
            maxAge: sessionTimeToLiveInSeconds * 1000,
            encode: String
        })
    }

    private async updateSession(session: Session, value: any): Promise<void> {
        const applicationData = session.getExtraData()
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .orDefault({
                appeal: {}
            } as ApplicationData);

        session.saveExtraData(APPLICATION_DATA_KEY, {
            ...applicationData,
            appeal: this.prepareModelPriorSessionSave(applicationData.appeal, value)
        });

        await this.sessionStore
            .store(Cookie.representationOf(session, sessionCookieSecret), session.data, sessionTimeToLiveInSeconds)
            .run();
    }

    // @ts-ignore
    protected abstract prepareModelPriorSessionSave(appeal: Appeal, value: MODEL): Appeal;
}

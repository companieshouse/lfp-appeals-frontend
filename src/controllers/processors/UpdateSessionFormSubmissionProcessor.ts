import { Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request, Response } from 'express';
import { injectable, unmanaged } from 'inversify';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

const sessionCookieName = getEnvOrDefault('COOKIE_NAME');
const sessionCookieDomain = getEnvOrDefault('COOKIE_DOMAIN');
const sessionCookieSecureFlag = getEnvOrDefault('COOKIE_SECURE_ONLY', 'true');
const sessionCookieSecret = getEnvOrDefault('COOKIE_SECRET');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrDefault('DEFAULT_SESSION_EXPIRATION'), 10);

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
            maxAge: sessionTimeToLiveInSeconds * 1000
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

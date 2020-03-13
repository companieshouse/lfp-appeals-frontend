import { Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request } from 'express';
import { injectable, unmanaged } from 'inversify';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

const sessionCookieSecret = getEnvOrDefault('COOKIE_SECRET');
const sessionTimeToLiveInSeconds = parseInt(getEnvOrDefault('DEFAULT_SESSION_EXPIRATION'), 10);

@injectable()
export abstract class UpdateSessionFormSubmissionProcessor<MODEL> implements FormSubmissionProcessor {
    protected constructor(@unmanaged() readonly sessionStore: SessionStore) {}

    async process(req: Request): Promise<void> {
        await this.updateSession(req.session.unsafeCoerce(), req.body)
    }

    private async updateSession(session: Session, value: any): Promise<void> {
        const appeal = session.getExtraData()
            .map<Appeal>(data => data[APPEALS_KEY])
            .orDefault({} as Appeal);

        session.saveExtraData(APPEALS_KEY, this.prepareModelPriorSessionSave(appeal, value));

        await this.sessionStore
            .store(Cookie.representationOf(session, sessionCookieSecret), session.data, sessionTimeToLiveInSeconds)
            .run();
    }

    // @ts-ignore
    protected abstract prepareModelPriorSessionSave(appeal: Appeal, value: MODEL): Appeal;
}

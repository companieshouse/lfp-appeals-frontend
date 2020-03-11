import { Session, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Request } from 'express';
import { injectable, unmanaged } from 'inversify';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';

@injectable()
export abstract class UpdateSessionFormSubmissionProcessor<MODEL> implements FormSubmissionProcessor {
    protected constructor(@unmanaged() readonly sessionStore: SessionStore) {}

    async process(req: Request): Promise<void> {
        await this.updateSession(req.session.unsafeCoerce(), req.body)
    }

    private async updateSession(session: Session, value: any): Promise<void> {
        session.saveExtraData(APPEALS_KEY, session.getExtraData()
            .chainNullable<Appeal>(data => data[APPEALS_KEY])
            .map(appeal => this.prepareModelPriorSessionSave(appeal, value))
            .orDefault({} as Appeal));

        await this.sessionStore
            .store(Cookie.representationOf(session, getEnvOrDefault('COOKIE_SECRET')), session.data)
            .run();
    }

    // @ts-ignore
    protected abstract prepareModelPriorSessionSave(appeal: Appeal, value: MODEL): Appeal;
}
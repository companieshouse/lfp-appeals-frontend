import { Session } from 'ch-node-session-handler/lib/session/model/Session';
import { Maybe } from 'ch-node-session-handler';

declare global {
    namespace Express {
        export interface Request {
            session: Maybe<Session>;
        }
    }
}

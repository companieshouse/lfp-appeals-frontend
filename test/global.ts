import { Session } from 'ch-node-session/lib/session/model/Session';
import { Maybe } from 'ch-node-session';

declare global {
    namespace Express {
        export interface Request {
            session: Maybe<Session>;
        }
    }
}
import { Session } from 'ch-node-session-handler';
import { AccessTokenKeys } from 'ch-node-session-handler/lib/session/keys/AccessTokenKeys';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from '../CommonErrors';

function getSignInInfo(session: Session | undefined): ISignInInfo | undefined {
  if (!session) {
    throw SESSION_NOT_FOUND_ERROR;
  }
  return session.data?.[SessionKey.SignInInfo];
}

export function getAccessToken(session: Session | undefined): string {
  const signInInfo = getSignInInfo(session);

  const accessToken = signInInfo?.[SignInInfoKeys.AccessToken]?.[AccessTokenKeys.AccessToken];

  if (!accessToken) {
    throw TOKEN_MISSING_ERROR;
  }

  return accessToken;
}
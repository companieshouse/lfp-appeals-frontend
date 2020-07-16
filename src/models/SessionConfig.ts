import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

export interface SessionStoreConfig {
    sessionCookieName: string;
    sessionCookieDomain: string;
    sessionCookieSecureFlag: string;
    sessionTimeToLiveInSeconds: number;
}

export class SessionConfig {

    static createFromEnvironmentVariables(): SessionStoreConfig {

        return {
            sessionCookieName: getEnvOrThrow('COOKIE_NAME'),
            sessionCookieDomain: getEnvOrThrow('COOKIE_DOMAIN'),
            sessionCookieSecureFlag: getEnvOrDefault('COOKIE_SECURE_ONLY', 'true'),
            sessionTimeToLiveInSeconds: parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10)
        };

    }
}

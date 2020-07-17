import { getEnvOrDefault, getEnvOrThrow } from 'app/utils/EnvironmentUtils';

export class SessionStoreConfig {

    constructor(public readonly sessionCookieName: string,
                public readonly sessionCookieDomain: string,
                public readonly sessionCookieSecureFlag: string,
                public readonly sessionTimeToLiveInSeconds: number) {}

    static createFromEnvironmentVariables(): SessionStoreConfig {
        return new SessionStoreConfig(
            getEnvOrThrow('COOKIE_NAME'),
            getEnvOrThrow('COOKIE_DOMAIN'),
            getEnvOrDefault('COOKIE_SECURE_ONLY', 'true'),
            parseInt(getEnvOrThrow('DEFAULT_SESSION_EXPIRATION'), 10)
        );
    }
}

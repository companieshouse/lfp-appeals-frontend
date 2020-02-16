export default interface IConfig {
    readonly ERIC_PORT: number;
    readonly CACHE_SERVER: string;
    readonly CACHE_DB: number;
    readonly CACHE_PASSWORD: string;
    readonly COOKIE_NAME: string;
    readonly COOKIE_SECRET: string;
    readonly DEFAULT_SESSION_EXPIRATION: number;

}
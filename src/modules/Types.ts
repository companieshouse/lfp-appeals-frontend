import { createApiClient } from 'ch-sdk-node';
import ApiClient from 'ch-sdk-node/dist/client';

type AuthType = 'OAuth2' | 'ApiKey' | 'None';
type KeyType = string | undefined;

type AuthObject<K = KeyType, T = AuthType> = { readonly name: T, readonly key: K } ;

type OAuth2 = AuthObject<string, 'OAuth2'>;
type ApiKey = AuthObject<string, 'ApiKey'>;
type None = AuthObject<undefined, 'None'>;

export type AuthMethod = OAuth2 | ApiKey | None;

export const OAuth2 = (key: string): OAuth2 => {
    return {
        name,
        key
    };
};

export const ApiKey = (key: string): ApiKey => {
    return {
        name,
        key
    };
};

export const None = (): None => {
    return {
        name,
        key: undefined
    };
};

export const CompaniesHouseSDK = (apiBasePath?: string) => (authObject: AuthMethod) => {
    switch(authObject.name) {
        case 'ApiKey':
            return createApiClient(authObject.key, undefined, apiBasePath);
        case 'OAuth2':
            return createApiClient(undefined, authObject.key, apiBasePath);
        case 'None':
            return createApiClient(undefined, undefined, apiBasePath);
    }
};

export type CompaniesHouseSDK = (authMethod: AuthMethod) => ApiClient;
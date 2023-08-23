// tslint:disable: max-classes-per-file
import { createApiClient } from "@companieshouse/api-sdk-node";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";

type AuthType = "OAuth2" | "ApiKey" | "None";
type KeyType = string | undefined;

type AuthObject<K = KeyType, T = AuthType> = {
    readonly name: T;
    readonly key: K;
};

type OAuth2Type = AuthObject<string, "OAuth2">;
type ApiKeyType = AuthObject<string, "ApiKey">;
type NoAuthType = AuthObject<undefined, "None">;

export class OAuth2 implements OAuth2Type {
    name: "OAuth2" = "OAuth2";
    constructor (public readonly key: string) {}
}
export class ApiKey implements ApiKeyType {
    name: "ApiKey" = "ApiKey";
    constructor (public readonly key: string) {}
}
export class NoAuth implements NoAuthType {
    name: "None" = "None";
    key: undefined = undefined;
}

export type AuthMethod = OAuth2 | ApiKey | NoAuth;

export const CompaniesHouseSDK = (apiBasePath?: string) => (authMethod: AuthMethod) => {
    switch (authMethod.name) {
    case "ApiKey":
        return createApiClient(authMethod.key, undefined, apiBasePath);
    case "OAuth2":
        return createApiClient(undefined, authMethod.key, apiBasePath);
    case "None":
        return createApiClient(undefined, undefined, apiBasePath);
    }
};

export type CompaniesHouseSDK = (authMethod: AuthMethod) => ApiClient;

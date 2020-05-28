import { createApiClient } from 'ch-sdk-node';
import ApiClient from 'ch-sdk-node/dist/client';

export const CompaniesHouseSDK = (apiKey: string) => createApiClient(apiKey);
export type CompaniesHouseSDK = ApiClient;
import { getEnv } from 'app/utils/EnvironmentUtils';
import { Feature } from 'app/utils/Feature';

export const isFeatureEnabled = (feature: Feature): boolean => {
    return getEnv(`${feature}_FEATURE`) === '1';
};

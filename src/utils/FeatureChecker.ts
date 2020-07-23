import { getEnv, getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { Feature } from 'app/utils/Feature';

export const isFeatureEnabled = (feature: Feature): boolean => {
    return getEnv(`${feature}_FEATURE`) === '1';
};

export const enabledAppealReasons = (): string[] => {
    const reasons = getEnvOrDefault('ENABLED_APPEAL_REASONS', 'other');
    const reasonsList: string[] = reasons.split(',');
    return reasonsList;
};

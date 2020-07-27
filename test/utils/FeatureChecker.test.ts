import { assert } from 'chai';

import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';

describe('Feature checker', () => {
    const feature: Feature = 'SUPER_POWER' as Feature;

    it ('should return true when feature is enabled', () => {
        process.env[`${feature}_FEATURE`] = '1';
        assert.isTrue(isFeatureEnabled(feature));
    });

    it ('should return false when feature is disabled', () => {
        process.env[`${feature}_FEATURE`] = '0';
        assert.isFalse(isFeatureEnabled(feature));
    });

    it ('should return false when feature flag is not configured', () => {
        delete process.env[`${feature}_FEATURE`];
        assert.isFalse(isFeatureEnabled(feature));
    });
});

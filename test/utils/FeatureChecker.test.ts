import { assert, expect } from 'chai';

import { Feature } from 'app/utils/Feature';
import { getEnabledAppealReasons, isFeatureEnabled } from 'app/utils/FeatureChecker';

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

    it('should return a list of enabled Appeal Reasons when requested', () => {
        const env = process.env;
        process.env.ENABLED_APPEAL_REASONS = 'illness,other';

        const result = getEnabledAppealReasons();
        process.env = env;

        expect(result).to.have.lengthOf(2);
        expect(result).to.contain('illness').and.to.contain('other');
    });
});

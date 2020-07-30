import { expect } from 'chai';

import { Feature } from 'app/utils/Feature';
import { isFeatureEnabled } from 'app/utils/FeatureChecker';

describe('Feature checker', () => {
    const feature: Feature = 'SUPER_POWER' as Feature;

    it ('should return true when feature is enabled', () => {
        process.env[`${feature}_FEATURE_ENABLED`] = '1';
        // tslint:disable-next-line: no-unused-expression
        expect(isFeatureEnabled(feature)).to.be.true;
    });

    it ('should return false when feature is disabled', () => {
        process.env[`${feature}_FEATURE_ENABLED`] = '0';
        // tslint:disable-next-line: no-unused-expression
        expect(isFeatureEnabled(feature)).to.be.false;
    });

    it ('should return false when feature flag is not configured', () => {
        delete process.env[`${feature}_FEATURE_ENABLED`];

        // tslint:disable-next-line: no-unused-expression
        expect(isFeatureEnabled(feature)).to.be.false;
    });
});

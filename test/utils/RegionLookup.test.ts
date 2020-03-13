import { expect } from 'chai';

import { findRegionByCompanyNumber, Region } from 'app/utils/RegionLookup';

describe('RegionLookup', () => {
    it('should identify scotland when SC is in front of company number', () => {
        const result = findRegionByCompanyNumber('SC123123');
        expect(result).to.be.equal(Region.SC);
    });
    it('should identify northern ireland when NI is in front of company number', () => {
        const result = findRegionByCompanyNumber('NI123123');
        expect(result).to.be.equal(Region.NI);
    });
    it('should identify default when no characters are in front of company number', () => {
        const result = findRegionByCompanyNumber('12123123');
        expect(result).to.be.equal(Region.DEFAULT);
    });
});

import { expect } from 'chai';

import { companyNumberRegionIdentifier } from 'app/utils/RegionIdentifier';


describe('companyNumberRegionIdentifier', () => {

    const northernIrelandTeam = process.env.NI_TEAM_EMAIL;
    const scotlandTeam = process.env.SC_TEAM_EMAIL;
    const defaultTeam = process.env.DEFAULT_TEAM_EMAIL;

    it('should identify scotland when SC in front of company number', () => {
        const result = companyNumberRegionIdentifier('SC123123');
        expect(result).to.be.equal(scotlandTeam);
    });
    it('should identify northern ireland when NI in front of company number', () => {
        const result = companyNumberRegionIdentifier('NI123123');
        expect(result).to.be.equal(northernIrelandTeam);
    });
    it('should identify default when no characters in front of company number', () => {
        const result = companyNumberRegionIdentifier('12123123');
        expect(result).to.be.equal(defaultTeam);
    });
    it('should identify default when random chracters in front of company number', () => {
        const result = companyNumberRegionIdentifier('ZZ123123');
        expect(result).to.be.equal(defaultTeam);
    });
});

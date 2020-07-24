import { expect } from 'chai';

import { createReasonsRadioGroup } from 'app/models/components/ReasonsRadioGroup';

describe('The Reasons Radio Group factory', () => {
    it('should only return radio buttons for enabled reasons', () => {
        const env = process.env;
        process.env.ENABLED_APPEAL_REASONS = 'other';

        const result = createReasonsRadioGroup();

        expect(result).to.have.length(1);
        expect(result[0]).to.have.property('value', 'other');
        expect(result[0]).not.to.have.property('value', 'illness');

        process.env = env;
    });
});
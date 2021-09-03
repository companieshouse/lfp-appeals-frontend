import { expect } from 'chai';

import { loggingMessage } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';

describe('Logger Middleware', () => {
    const createdBy = { id: 'SomeID', name: 'SomeName' };
    const penaltyIdentifier = { companyNumber: 'NI000000', penaltyReference: 'NI000000' };
    const appeal = {
        id: 'SomeID',
        penaltyIdentifier,
        createdBy,
        reasons: { illness: {} }
    } as Appeal;

    it('should return well formatted string with non sensitive appeal details', () => {
        const mockClassName = 'AnyClassName';
        const mocktext = 'AnyClassName - appealId: SomeID - userId: SomeID - penaltyIdentifier: NI000000 - companyNumber: NI000000';

        expect(loggingMessage(appeal, mockClassName)).to.be.equal(mocktext);
    });
});
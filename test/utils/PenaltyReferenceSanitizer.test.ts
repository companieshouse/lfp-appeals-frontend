import { expect } from 'chai';

import { sanitizeLegacyPenalty } from 'app/utils/PenaltyReferenceSanitizer';

describe('PenaltyReferenceSanitizer', () => {

    it('should trim whitespaces', () => {
        ['PEN1A/NI 000123', 'PEN1A/NI000 123 ', 'PEN1A/NI 00 01 23'].forEach(valueWithWhitespaces => {
            const result = sanitizeLegacyPenalty(valueWithWhitespaces);
            expect(result).to.be.equal('PEN1A/NI000123');
        });
    });

    it('should uppercase lowercase characters', () =>{
        const result = sanitizeLegacyPenalty('PEN1A/ni000123');
        expect(result).to.be.equal('PEN1A/NI000123');
    });

    it('should pad 4 digits to 8 characters', () =>{
        const result = sanitizeLegacyPenalty('PEN1A/1234');
        expect(result).to.be.equal('PEN1A/00001234');
    });

    it('should pad only digits when SC is leading number', () =>{
        const result = sanitizeLegacyPenalty('PEN2A/SC1234');
        expect(result).to.be.equal('PEN2A/SC001234');
    });

    it('should pad only digits when NI is leading number', () =>{
        const result = sanitizeLegacyPenalty('PEN1A/NI1234');
        expect(result).to.be.equal('PEN1A/NI001234');
    });

    it('should not pad full 8 digit numbers', () =>{
        const result = sanitizeLegacyPenalty('PEN1A/12345678');
        expect(result).to.be.equal('PEN1A/12345678');
    });

    it('should not pad full 2 letters and 6 digit numbers', () =>{
        const result = sanitizeLegacyPenalty('PEN3A/NI345678');
        expect(result).to.be.equal('PEN3A/NI345678');
    });

    it('should not pad inputs with more than 8 characters', () =>{
        const result = sanitizeLegacyPenalty('PEN2A/NI345678213');
        expect(result).to.be.equal('PEN2A/NI345678213');
    });

    it('should pad inputs with no digits', () =>{
        const result = sanitizeLegacyPenalty('PEN2A/NI');
        expect(result).to.be.equal('PEN2A/NI000000');
    });

});

import { expect } from 'chai'
import { sanitize } from '../../src/utils/CompanyNumberSanitizer'

describe('CompanyNumberSanitizer', () => {
    it('should throw error when company number undefined or empty', () =>{
        [undefined, null, ''].forEach(missingValue => {
            expect(() => sanitize(missingValue as string)).to.throw('Company number is required')
        })
    });

    it('should trim whitespaces', () => {
        [' NI000123', 'NI000123 ', ' NI000123 ', 'NI 00 01 23'].forEach(valueWithWhitespaces => {
            const result = sanitize(valueWithWhitespaces);
            expect(result).to.be.equal('NI000123');
        });
    });

    it('should uppercase lowercase characters', () =>{
        const result = sanitize('ni000123');
        expect(result).to.be.equal('NI000123');
    });

    it('should pad 4 digits to 8 characters', () =>{
        const result = sanitize('1234');
        expect(result).to.be.equal('00001234');
    });

    it('should pad only digits when SC is leading number', () =>{
        const result = sanitize('SC1234');
        expect(result).to.be.equal('SC001234');
    });

    it('should pad only digits when NI is leading number', () =>{
        const result = sanitize('NI1234');
        expect(result).to.be.equal('NI001234');
    });

    it('should not pad full 8 digit numbers', () =>{
        const result = sanitize('12345678');
        expect(result).to.be.equal('12345678');
    });

    it('should not pad full 2 letters and 6 digit numbers', () =>{
        const result = sanitize('NI345678');
        expect(result).to.be.equal('NI345678');
    });

    it('should not pad inputs with more than 8 characters', () =>{
        const result = sanitize('NI345678213');
        expect(result).to.be.equal('NI345678213');
    });
});

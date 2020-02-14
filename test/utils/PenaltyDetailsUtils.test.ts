import {sanitize} from '../../src/utils/PenaltyDetailsUtils'
import { expect } from 'chai'



describe('Penalty Entry Sanitize function', () => {

    it('should uppercase lowercase characters', () =>{
        const result = sanitize(({companyNumber: 'ni123', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'ni000123', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad full 8 digit numbers', () =>{
        const result = sanitize(({companyNumber: '12345678', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: '12345678', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad full 2 letters and 6 digit numbers', () =>{
        const result = sanitize(({companyNumber: 'NI345678', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'NI345678', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad inputs with more than 8 characters', () =>{
        const result = sanitize(({companyNumber: 'NI345678213', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'NI345678213', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should pad 4 digits to 8 characters', () =>{
        const result = sanitize(({companyNumber: '1234', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: '00001234', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should pad only digits when SC is leading number', () =>{
        const result = sanitize(({companyNumber: 'SC1234', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'SC001234', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should pad only digits when NI is leading number', () =>{
        const result = sanitize(({companyNumber: 'NI1234', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'NI001234', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })
})
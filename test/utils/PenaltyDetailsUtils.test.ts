import {sanitize} from '../../src/utils/PenaltyDetailsUtils'
import { expect } from 'chai'



describe('Penalty Entry Sanitize function', () => {
    it('should pad after first 2 leading characters', () =>{
        const result = sanitize(({companyNumber: 'SC123', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'SC000123', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })


    it('should uppercase lowercase characters', () =>{
        const result = sanitize(({companyNumber: 'ni123', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'ni000123', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad 8 character inputs with only numbers', () =>{
        const result = sanitize(({companyNumber: '12345678', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: '12345678', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad 8 character inputs with some letters', () =>{
        const result = sanitize(({companyNumber: 'NI345678', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'NI345678', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad inputs with more than 8 characters', () =>{
        const result = sanitize(({companyNumber: 'NI345678213', penaltyReference: ''}))
        const expectedResult = sanitize(({companyNumber: 'NI345678213', penaltyReference: ''}))
        expect(result).to.be.deep.equal(expectedResult);
    })
})
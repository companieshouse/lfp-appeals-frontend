import {sanitize} from '../../src/utils/CompanyNumberUtils'
import { expect } from 'chai'


describe('Penalty Entry Sanitize function', () => {
    it('should pad after first 2 leading characters', () =>{
        const result = sanitize('SC123')
        const expectedResult = 'SC000123'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should pad after first 1 leading character', () =>{
        const result = sanitize('S123')
        const expectedResult = 'S0000123'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should uppercase lowercase characters', () =>{
        const result = sanitize('sc123')
        const expectedResult = 'SC000123'
        expect(result).to.be.deep.equal(expectedResult);
    })
    it('should not pad empty inputs', () =>{
        const result = sanitize('')
        const expectedResult = ''
        expect(result).to.be.deep.equal(expectedResult);
    })
    it('should not pad 8 character inputs with only numbers', () =>{
        const result = sanitize('12345678')
        const expectedResult = '12345678'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad 8 character inputs with some letters', () =>{
        const result = sanitize('SC345678')
        const expectedResult = 'SC345678'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not pad inputs with more than 8 characters', () =>{
        const result = sanitize('SC345678910')
        const expectedResult = 'SC345678910'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not modify non alphanumeric strings [spaces]', () =>{
        const result = sanitize('SC345 678910')
        const expectedResult = 'SC345 678910'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not modify non alphanumeric strings [symbols]', () =>{
        const result = sanitize('SC3£$')
        const expectedResult = 'SC3£$'
        expect(result).to.be.deep.equal(expectedResult);
    })

    it('should not modify non alphanumeric strings [spaces and symbols]', () =>{
        const result = sanitize('S C3£ $45')
        const expectedResult = 'S C3£ $45'
        expect(result).to.be.deep.equal(expectedResult);
    })

})
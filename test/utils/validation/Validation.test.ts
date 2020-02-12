
import { expect } from 'chai';
import { SchemaValidator } from '../../../src/utils/validation/SchemaValidator';
import { penaltyDetailsSchema } from '../../../src/utils/Schemas';

const validator = new SchemaValidator(penaltyDetailsSchema);

interface PenaltyReferenceDetails{
    companyNumber: string;
    penaltyReference: string;
  }

describe('Validate', () => {
    it('should return no errors to two correct inputs', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'A12345678',
            companyNumber: 'SC123123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {errors: []}
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return two errors for two empty fields', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '',
            companyNumber: ''
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
            errors:[{field: 'companyNumber',text : 'You must enter a company number'},
            {field: 'penaltyReference',text: 'You must enter a penalty reference number'}]
    }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return penaltyReference error to incorrect penalty reference number', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '12345678',
            companyNumber: 'SC123123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return companyNumber error to incorrect company number', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'H12345678',
            companyNumber: 'S1231231'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });


    it('should return errors for both fields when both are incorrect inputs', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '12345678',
            companyNumber: 'A123123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[
                {field: 'companyNumber', text : 'You must enter your full eight character company number'},
                {field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });
});
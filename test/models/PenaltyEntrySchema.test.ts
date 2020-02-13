
import { expect } from 'chai';
import { SchemaValidator } from '../../src/utils/validation/SchemaValidator';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';
import { schema } from '../../src/models/PenaltyReferenceDetails.schema'


describe('Penalty Details Schema Validation', () => {

    const validator = new SchemaValidator(schema);

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
            errors:[
                {field: 'companyNumber',text : 'You must enter a company number'},
                {field: 'penaltyReference',text: 'You must enter a penalty reference number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors to correct lowercase company numbers', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'A12345678',
            companyNumber: 'sc123123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {errors: [{field: 'companyNumber', text : 'You must enter your full eight character company number'}]}
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors to correct lowercase penalty references', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'a12345678',
            companyNumber: 'sc123123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {errors: [
            {field: 'companyNumber', text : 'You must enter your full eight character company number'},
            {field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'},]}
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return penaltyReference error to penalty reference number missing leading character', () => {

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

    it('should return companyNumber error to company number without correct leading characters', () => {

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

    it('should return errors for company numbers with letters mid-number', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12345678',
            companyNumber: '123SC123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for company numbers with less than 8 total characters', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12345678',
            companyNumber: '123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for penalty references with less than 9 total characters', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L123456',
            companyNumber: '123'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[
                    {field: 'companyNumber', text : 'You must enter your full eight character company number'},
                    {field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for penalty references with more than 9 total characters', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L123412372312',
            companyNumber: '12312312'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for company numbers with only a spaces', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12345678',
            companyNumber: ' '
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for correct company numbers with spaces', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12345678',
            companyNumber: 'SC 12 34 56'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for correct penalty references with spaces ', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12 34 56 78',
            companyNumber: '12312312'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for symbols in company number', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12345678',
            companyNumber: 'SC12$$56'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors for symbols in penaltyReference', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'L12*45678',
            companyNumber: '12345678'
        };
        const result = validator.validate(penaltyDetails)
        const expectedResult = {
                errors:[{field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
        }
        expect(result).to.deep.equal(expectedResult)
    });
});
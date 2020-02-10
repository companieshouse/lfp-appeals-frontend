
import { expect } from 'chai';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';
import { Validate } from '../../src/utils/Validate';


describe('Validate', () => {
    it('should return no errors to correct input', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: 'A12345678',
            companyNumber: 'SC123123'
        };
        const result = Validate.validate(penaltyDetails)
        const expectedResult = {
            errors: []
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return penaltyReference errors to incorrect penaltyReference', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '12345678',
            companyNumber: 'SC123123'
        };
        const result = Validate.validate(penaltyDetails)
        const expectedResult = {
                errors:[{
                    field: 'penaltyReference',
                    text: 'You must enter your reference number exactly as shown on your penalty notice'
                }]
        }
        expect(result).to.deep.equal(expectedResult)
    });

    it('should return errors to incorrect input', () => {

        const penaltyDetails: PenaltyReferenceDetails = {
            penaltyReference: '12345678',
            companyNumber: 'A123123'
        };
        const result = Validate.validate(penaltyDetails)
        const expectedResult = {
                errors:[
                {
                    field: 'companyNumber',
                    text : 'You must enter your full eight character company number'
                },
                {
                    field: 'penaltyReference',
                    text: 'You must enter your reference number exactly as shown on your penalty notice'
                }]
        }
        expect(result).to.deep.equal(expectedResult)
    });
});
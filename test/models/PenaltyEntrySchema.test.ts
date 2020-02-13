
import { expect } from 'chai';
import { SchemaValidator } from '../../src/utils/validation/SchemaValidator';
import { PenaltyReferenceDetails } from '../../src/models/PenaltyReferenceDetails';
import { schema } from '../../src/models/PenaltyReferenceDetails.schema'


describe('Penalty Details Schema Validation', () => {

    const validator = new SchemaValidator(schema);

    describe('Company Number', () => {
        describe('Happy path', () => {

            it('should accept SC leading characters input', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'A12345678',
                    companyNumber: 'SC123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors: []}
                expect(result).to.deep.equal(expectedResult)
            });

            it('should accept NI leading characters input', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'A12345678',
                    companyNumber: 'NI123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors: []}
                expect(result).to.deep.equal(expectedResult)
            });

            it('should accept no leading characters input', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'A12345678',
                    companyNumber: '12123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors: []}
                expect(result).to.deep.equal(expectedResult)
            });

            it('should accept leading characters in lowercase', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'A12345678',
                    companyNumber: 'sc123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors: []}
                expect(result).to.deep.equal(expectedResult)
            });

            it('should accept company numbers with less than 8 total characters', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'L12345678',
                    companyNumber: '123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors:[]}
                expect(result).to.deep.equal(expectedResult)
            });
        })

        describe('Bad path', () => {
            it('should reject empty field', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'A12345678',
                    companyNumber: ''
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {
                    errors:[{field: 'companyNumber',text : 'You must enter a company number'}]
                }
                expect(result).to.deep.equal(expectedResult)
            });

            it('should reject company number without correct leading characters', () => {

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

            it('should reject company numbers with letters mid-number', () => {

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

            it('should reject empty spaces', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'L12345678',
                    companyNumber: '  '
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {
                        errors:[{field: 'companyNumber', text : 'You must enter your full eight character company number'}]
                }
                expect(result).to.deep.equal(expectedResult)
            });

            it('should reject company numbers with spaces', () => {

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

            it('should reject symbols in company number', () => {

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


        })
    })

    describe('Penalty Reference', () => {
        describe('Happy path', () => {
            it('should accept leading character', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'Z12345678',
                    companyNumber: 'NI123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {errors: []}
                expect(result).to.deep.equal(expectedResult)
            });

        })

        describe('Bad path', () => {

            it('should reject empty field', () => {
                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: '',
                    companyNumber: 'SC123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {
                    errors:[{field: 'penaltyReference',text : 'You must enter a penalty reference number'}]
                }
                expect(result).to.deep.equal(expectedResult)
            });

            it('should reject correct penalty reference in lowercase', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'b12345678',
                    companyNumber: 'NI123123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {
                    errors:[{field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
                }
                expect(result).to.deep.equal(expectedResult)
            });

            it('should reject penalty reference number missing leading character', () => {

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

            it('should reject penalty references with less than 9 total characters', () => {

                const penaltyDetails: PenaltyReferenceDetails = {
                    penaltyReference: 'L123456',
                    companyNumber: '123'
                };
                const result = validator.validate(penaltyDetails)
                const expectedResult = {
                        errors:[
                            {field: 'penaltyReference', text: 'You must enter your reference number exactly as shown on your penalty notice'}]
                }
                expect(result).to.deep.equal(expectedResult)
            });

            it('should reject spaces in penalty references', () => {

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

            it('should reject symbols in penalty reference', () => {

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
        })
    })
});
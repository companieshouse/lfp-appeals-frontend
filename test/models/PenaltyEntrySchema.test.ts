import { expect } from 'chai';

import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { schema } from 'app/models/PenaltyIdentifier.schema';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';


describe('Penalty Details Schema Validation', () => {

    const validator = new SchemaValidator(schema);

    describe('Company Number', () => {
        function createModelWithCompanyNumber(companyNumber: string): PenaltyIdentifier {
            const validPenaltyReference = 'A12345678';
            return {
                companyNumber,
                penaltyReference: validPenaltyReference,
                userInputPenaltyReference: validPenaltyReference
            };
        }

        describe('Happy path', () => {
            it('should accept SC leading characters input', () => {
                const result = validator.validate(createModelWithCompanyNumber('SC123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept NI leading characters input', () => {
                const result = validator.validate(createModelWithCompanyNumber('NI123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept no leading characters input', () => {
                const result = validator.validate(createModelWithCompanyNumber('12123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept leading characters in lowercase', () => {
                const result = validator.validate(createModelWithCompanyNumber('sc123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept company numbers with less than 8 total characters', () => {
                const result = validator.validate(createModelWithCompanyNumber('123'));
                expect(result).to.deep.equal({ errors: [] });
            });
        });

        describe('Bad path', () => {
            it('should reject empty field', () => {
                const result = validator.validate(createModelWithCompanyNumber(''));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter a company number'
                    }]
                });
            });

            it('should reject company number without correct leading characters', () => {
                const result = validator.validate(createModelWithCompanyNumber('S1231231'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should reject company numbers with letters mid-number', () => {
                const result = validator.validate(createModelWithCompanyNumber('123SC123'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should reject empty spaces', () => {
                const result = validator.validate(createModelWithCompanyNumber('  '));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should reject company numbers with leading and trailing spaces', () => {
                const result = validator.validate(createModelWithCompanyNumber(' SC123456 '));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should reject company numbers with spaces', () => {
                const result = validator.validate(createModelWithCompanyNumber('SC 12 34 56'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should reject symbols in company number', () => {
                const result = validator.validate(createModelWithCompanyNumber('SC12$$56'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });
        });
    });

    describe('Penalty Reference', () => {
        function createModelWithPenaltyReference(userInputPenaltyReference: string): PenaltyIdentifier {
            const validCompanyNumber = 'SC123123';
            return {
                userInputPenaltyReference,
                penaltyReference: userInputPenaltyReference,
                companyNumber: validCompanyNumber
            };
        }

        describe('Happy path', () => {
            it('should accept uppercase leading character', () => {
                const result = validator.validate(createModelWithPenaltyReference('Z12345678'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept lowercase leading character', () => {
                const result = validator.validate(createModelWithPenaltyReference('z12345678'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept only digits', () => {
                const result = validator.validate(createModelWithPenaltyReference('12345678'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept company number format', () => {
                const result = validator.validate(createModelWithPenaltyReference('SC123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept legacy penalty references', () => {
                const result = validator.validate(createModelWithPenaltyReference('PEN1A/SC123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept lower case legacy penalty references', () => {
                const result = validator.validate(createModelWithPenaltyReference('pen1A/sc123123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept legacy penalty references with hidden leading zeros', () => {
                const result = validator.validate(createModelWithPenaltyReference('PEN1A/sc123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it('should accept legacy penalty references with leading zeros', () => {
                const result = validator.validate(createModelWithPenaltyReference('PEN1A/sc000123'));
                expect(result).to.deep.equal({ errors: [] });
            });

            it(`should accept legacy penalty references with prefix number 1`, () => {
                const result = validator.validate(createModelWithPenaltyReference(`pen1A/sc123`));
                expect(result).to.deep.equal({ errors: [] });
            });

            it(`should accept legacy penalty references with prefix number 2`, () => {
                const result = validator.validate(createModelWithPenaltyReference(`pen2A/sc123`));
                expect(result).to.deep.equal({ errors: [] });
            });

            it(`should accept legacy penalty references with prefix number 8`, () => {
                const result = validator.validate(createModelWithPenaltyReference(`pen8A/sc123`));
                expect(result).to.deep.equal({ errors: [] });
            });

            it(`should accept legacy penalty references with only numbers as company number`, () => {
                const result = validator.validate(createModelWithPenaltyReference(`PEN1A/12345678`));
                expect(result).to.deep.equal({ errors: [] });
            });

        });

        describe('Bad path', () => {
            it('should reject empty field', () => {
                const result = validator.validate(createModelWithPenaltyReference(''));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter a penalty reference number'
                    }]
                });
            });

            it('should reject numbers with less than 8 total characters', () => {
                const result = validator.validate(createModelWithPenaltyReference('L123456'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter your reference number exactly as shown on your penalty notice'
                    }]
                });
            });

            it('should reject numbers of more than 14 characters', () => {
                const result = validator.validate(createModelWithPenaltyReference('PEN12A/SC123123'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter your reference number exactly as shown on your penalty notice'
                    }]
                });
            });

            it('should reject penalty references with leading and trailing spaces', () => {
                const result = validator.validate(createModelWithPenaltyReference(' L12345678 '));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter your reference number exactly as shown on your penalty notice'
                    }]
                });
            });

            it('should reject spaces in penalty references', () => {
                const result = validator.validate(createModelWithPenaltyReference('L12 34 56 78'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter your reference number exactly as shown on your penalty notice'
                    }]
                });
            });

            it('should reject symbols (not including /) in penalty reference', () => {
                const result = validator.validate(createModelWithPenaltyReference('L12*45678'));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter your reference number exactly as shown on your penalty notice'
                    }]
                });
            });
        });
    });
});

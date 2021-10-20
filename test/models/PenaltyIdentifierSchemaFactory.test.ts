import { assert, expect } from 'chai';

import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { PenaltyIdentifierSchemaFactory } from 'app/models/PenaltyIdentifierSchemaFactory';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { SchemaValidator } from 'app/utils/validation/SchemaValidator';


describe('PenaltyIdentifierSchemaFactory', () => {

    const companyNumberSchemaFactory = new PenaltyIdentifierSchemaFactory(getEnvOrThrow('ALLOWED_COMPANY_PREFIXES'));

    const validator = new SchemaValidator(companyNumberSchemaFactory.getPenaltyIdentifierSchema());

    describe('Company Number', () => {
        function createModelWithCompanyNumber(companyNumber: string): PenaltyIdentifier {
            const validPenaltyReference = 'A1234567';
            return {
                companyNumber,
                penaltyReference: validPenaltyReference,
                userInputPenaltyReference: validPenaltyReference
            };
        }

        const upperCaseValidCompanyNumbers = [
            'NI000000',
            'SC123123',
            'OC123123',
            'SO123123',
            'R0000000',
            'R123',
            '123',
            'AP123456'
        ];

        describe('Config changes', () => {

            it('should throw an error if no prefix is provided', () => {
                try {
                    new PenaltyIdentifierSchemaFactory('').getPenaltyIdentifierSchema();
                    assert.fail('It should have thrown an error');
                } catch (err) {
                    expect(err.message).to.equal('Prefix list formatting error. Make sure list is comma separated e.g. NI,SI,R');
                }
            });

            it('should throw an error if prefix list in wrong format is provided', () => {
                try {
                    new PenaltyIdentifierSchemaFactory('A,,A,B,NI').getPenaltyIdentifierSchema();
                    assert.fail('It should have thrown an error');
                } catch (err) {
                    expect(err.message).to.equal('Prefix list formatting error. Make sure list is comma separated e.g. NI,SI,R');
                }
            });

            it('should allow validation of SC only', () => {

                const configChangeValidator = new SchemaValidator(
                    new PenaltyIdentifierSchemaFactory('SC').getPenaltyIdentifierSchema()
                );

                const pass = configChangeValidator.validate(createModelWithCompanyNumber('SC123123'));
                expect(pass).to.deep.equal({ errors: [] });

                const fail = configChangeValidator.validate(createModelWithCompanyNumber('NI123123'));
                expect(fail).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

            it('should allow validation of SC and R only', () => {

                const configChangeValidator = new SchemaValidator(
                    new PenaltyIdentifierSchemaFactory('SC,R').getPenaltyIdentifierSchema()
                );

                const passSC = configChangeValidator.validate(createModelWithCompanyNumber('SC123123'));
                expect(passSC).to.deep.equal({ errors: [] });

                const passR = configChangeValidator.validate(createModelWithCompanyNumber('R0000001'));
                expect(passR).to.deep.equal({ errors: [] });

                const fail = configChangeValidator.validate(createModelWithCompanyNumber('NI123123'));
                expect(fail).to.deep.equal({
                    errors: [{
                        field: 'companyNumber',
                        text: 'You must enter your full eight character company number'
                    }]
                });
            });

        });

        describe('Happy path', () => {
            it('should accept valid company numbers as input (upper and lower case)', () => {

                const lowerCaseValidCompanyNumbers = upperCaseValidCompanyNumbers.map(value => value.toLowerCase());
                const validCompanyNumbers = lowerCaseValidCompanyNumbers.concat(upperCaseValidCompanyNumbers);

                validCompanyNumbers.forEach(companyNumber => {
                    const result = validator.validate(createModelWithCompanyNumber(companyNumber));
                    expect(result, `Company Number: ${companyNumber}`).to.deep.equal({ errors: [] });
                });
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

        const upperCaseValidPenaltyReferences = [
            'Z1234567'
            // 'A1234566',
            // 'S1123123',
            // 'SO123123',
            // 'PEN 1A/12312311',
            // 'PEN2A/11000123',
            // 'PEN1A/12345678',
            // 'PEN 2A/11111111'
        ];

        describe('Happy path', () => {
            it('should accept valid penalty references (upper and lower case)', () => {

                const lowerCaseValidPenaltyReferences = upperCaseValidPenaltyReferences
                    .map(value => value.toLowerCase());

                const validPenaltyReferences = lowerCaseValidPenaltyReferences
                    .concat(upperCaseValidPenaltyReferences);

                validPenaltyReferences.forEach(penaltyReference => {
                    const result = validator.validate(createModelWithPenaltyReference(penaltyReference));
                    expect(result).to.deep.equal({ errors: [] });
                });
            });

        });

        describe('Bad path', () => {
            it('should reject empty field', () => {
                const result = validator.validate(createModelWithPenaltyReference(''));
                expect(result).to.deep.equal({
                    errors: [{
                        field: 'userInputPenaltyReference',
                        text: 'You must enter a reference number'
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

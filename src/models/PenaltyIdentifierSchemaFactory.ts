import Joi from '@hapi/joi';

type PrefixVariation = { upperCase: string[]; lowerCase: string[]; };
type PrefixMap = { singleCharacter: PrefixVariation, doubleCharacter: PrefixVariation; };

export class PenaltyIdentifierSchemaFactory {

    public readonly companyNumberRegex: RegExp;

    public readonly penaltyReferenceRegex: RegExp;

    constructor(companyNumberPrefixes: string) {

        if (companyNumberPrefixes.length === 0) {
            throw new Error('Company prefixes must not be empty. e.g. NI,SC,SO');
        }

        if (companyNumberPrefixes === '*') {
            this.companyNumberRegex = /^[A-Za-z0-9]{8}$/i;
        } else {

            const prefixesArray: string[] = companyNumberPrefixes.split(',');

            const singleCharacterPrefixArray: string[] = prefixesArray.filter(prefix => prefix.length === 1);
            const doubleCharacterPrefixArray: string[] = prefixesArray.filter(prefix => prefix.length === 2);

            const prefixes: PrefixMap = {
                singleCharacter: {
                    lowerCase: this.makeLowerCase(singleCharacterPrefixArray),
                    upperCase: this.makeUpperCase(singleCharacterPrefixArray)
                },
                doubleCharacter: {
                    lowerCase: this.makeLowerCase(doubleCharacterPrefixArray),
                    upperCase: this.makeUpperCase(doubleCharacterPrefixArray)
                }
            };

            const singleCharacterRegex = `(${[
                prefixes.singleCharacter.lowerCase.reduceRight((p, c) => `${p}|${c}`, '').substr(1),
                prefixes.singleCharacter.upperCase.reduceRight((p, c) => `${p}|${c}`, '')
            ].join('')})[0-9]{1,7}`;

            const doubleCharacterRegex = `(${[
                prefixes.doubleCharacter.lowerCase.reduceRight((p, c) => `${p}|${c}`, '').substr(1),
                prefixes.doubleCharacter.upperCase.reduceRight((p, c) => `${p}|${c}`, '')
            ].join('')})[0-9]{1,6}`;

            const onlyNumbersRegex = '[0-9]{1,8}';

            this.companyNumberRegex = new RegExp(`^(${
                [singleCharacterRegex, doubleCharacterRegex, onlyNumbersRegex].join('|')
                })$`);
        }

        this.penaltyReferenceRegex = /^[a-z0-9/]{8,14}$/i;

    }

    public getCompanyNumberSchema(): Joi.StringSchema {
        return Joi.string()
            .required()
            .regex(this.companyNumberRegex)
            .messages({
                'string.empty': 'You must enter a company number',
                'string.pattern.base': 'You must enter your full eight character company number'
            });
    }

    public getPenaltyReferenceSchema(): Joi.StringSchema {
        return Joi.string()
            .required()
            .regex(this.penaltyReferenceRegex)
            .messages({
                'string.empty': 'You must enter a penalty reference number',
                'string.pattern.base': 'You must enter your reference number exactly as shown on your penalty notice'
            });
    }

    public getPenaltyIdentifierSchema(): Joi.ObjectSchema {
        return Joi.object({
            companyNumber: this.getCompanyNumberSchema(),
            userInputPenaltyReference: this.getPenaltyReferenceSchema(),
            penaltyReference: Joi.allow()
        });
    }

    private makeUpperCase(array: string[]): string[] {
        return array.map(prefix => prefix.toUpperCase());
    }

    private makeLowerCase(array: string[]): string[] {
        return array.map(prefix => prefix.toLowerCase());
    }
}

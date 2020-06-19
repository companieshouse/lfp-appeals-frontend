import Joi from '@hapi/joi';

export class PenaltyIdentifierSchemaFactory {

    public readonly companyNumberRegex: RegExp;

    public readonly penaltyReferenceRegex: RegExp;

    constructor(companyNumberPrefixes: string) {

        const listCheckRegex: RegExp = /^([A-Z][A-Z]?)\b(,[A-Z][A-Z]?)*$/i;

        if (!listCheckRegex.test(companyNumberPrefixes)) {
            throw new Error('Prefix list formatting error. Make sure list is comma separated e.g. NI,SI,R');
        }

        const prefixesArray: string[] = companyNumberPrefixes.split(',');

        const singleCharacterPrefixRegex: string = '('
            .concat(prefixesArray
                .filter(prefix => prefix.length === 1)
                .reduceRight((p, c) => `${p}|${c}`, '').substr(1)
                .concat(')')
                .concat('[0-9]{1,7}')
            );

        const doubleCharacterPrefixRegex: string = '('
            .concat(prefixesArray
                .filter(prefix => prefix.length === 2)
                .reduceRight((p, c) => `${p}|${c}`, '').substr(1)
                .concat(')')
                .concat('[0-9]{1,6}')
            );

        const onlyNumbersRegex = '[0-9]{1,8}';

        this.companyNumberRegex = new RegExp(`^(${
            [singleCharacterPrefixRegex, doubleCharacterPrefixRegex, onlyNumbersRegex].join('|')
            })$`, 'i');

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
}

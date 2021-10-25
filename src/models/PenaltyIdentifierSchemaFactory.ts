import Joi from '@hapi/joi';

export class PenaltyIdentifierSchemaFactory {

    static COMPANY_NUMBER_PATTERN_ERR_MSG: string = 'You must enter your full eight character company number';
    static COMPANY_NUMBER_EMPTY_ERR_MSG: string = 'You must enter a company number';
    static PENALTY_REFERENCE_NUMBER_PATTERN_ERR_MSG: string = 'You must enter your reference number exactly as shown on your penalty notice';
    static PENALTY_REFERENCE_NUMBER_EMPTY_ERR_MSG: string = 'You must enter a reference number';

    public readonly companyNumberRegex: RegExp;

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
    }

    public getCompanyNumberSchema(): Joi.StringSchema {
        return Joi.string()
            .required()
            .regex(this.companyNumberRegex)
            .messages({
                'string.empty': PenaltyIdentifierSchemaFactory.COMPANY_NUMBER_EMPTY_ERR_MSG,
                'string.pattern.base': PenaltyIdentifierSchemaFactory.COMPANY_NUMBER_PATTERN_ERR_MSG
            });
    }

    public getPenaltyReferenceSchema(): Joi.StringSchema {
        return Joi.string()
            .required()
            .regex(/^(([A-Z][0-9]{8})|(PEN ?(1|2)A\/[0-9]{8}))$/)
            .messages({
                'string.empty': PenaltyIdentifierSchemaFactory.PENALTY_REFERENCE_NUMBER_EMPTY_ERR_MSG,
                'string.pattern.base': PenaltyIdentifierSchemaFactory.PENALTY_REFERENCE_NUMBER_PATTERN_ERR_MSG
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

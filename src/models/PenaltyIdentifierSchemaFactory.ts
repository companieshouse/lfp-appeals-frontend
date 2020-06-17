import Joi from '@hapi/joi';

export class PenaltyIdentifierSchemaFactory {

    public readonly companyNumberRegex: RegExp;

    public readonly penaltyReferenceRegex: RegExp;

    constructor(companyNumberPrefixes: string) {
        if (companyNumberPrefixes === '*') {
            this.companyNumberRegex = /^[A-Za-z0-9]{8}$/i;
        }

        const upperCasePrefixArray: string[] = companyNumberPrefixes.split(',').map(prefix => prefix.toUpperCase());
        const lowerCasePrefix: string[] = upperCasePrefixArray.map(prefix => prefix.toLowerCase());

        const upperCaseRegexPrefixes = upperCasePrefixArray.reduceRight((p, c) => `${p}|${c}`, '');
        const lowerCaseRegexPrefixes = lowerCasePrefix.reduceRight((p, c) => `${p}|${c}`, '').substr(1);

        const regexPrefixes = `(${lowerCaseRegexPrefixes}${upperCaseRegexPrefixes})`;

        this.companyNumberRegex = new RegExp(`^(${regexPrefixes}[0-9]{1,6}|[0-9]{1,8})$`);
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
            penaltyReference: this.getPenaltyReferenceSchema()
        });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationResult_1 = require("./ValidationResult");
const ValidationError_1 = require("./ValidationError");
const validationOptions = {
    abortEarly: false,
    convert: false
};
class SchemaValidator {
    constructor(schema) {
        this.schema = schema;
        if (!schema) {
            throw new Error('Schema is required');
        }
    }
    validate(data) {
        const { error } = this.schema.validate(data, validationOptions);
        return new ValidationResult_1.ValidationResult(error ? error.details.map(item => {
            return new ValidationError_1.ValidationError(item.path.join('.'), item.message);
        }) : []);
    }
}
exports.SchemaValidator = SchemaValidator;

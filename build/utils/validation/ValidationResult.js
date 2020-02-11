"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationResult {
    constructor(errors = []) {
        this.errors = errors;
    }
    getErrorForField(field) {
        return this.errors.find(error => error.field === field);
    }
}
exports.ValidationResult = ValidationResult;

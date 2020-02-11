"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hyphenise = (value) => {
    return value
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
        .toLowerCase();
};
class ValidationError {
    constructor(field, text) {
        this.field = field;
        this.text = text;
        if (!field) {
            throw new Error('Field name is required');
        }
        if (!text) {
            throw new Error('Error message is required');
        }
    }
    get href() {
        return `#${hyphenise(this.field)}-error`;
    }
}
exports.ValidationError = ValidationError;

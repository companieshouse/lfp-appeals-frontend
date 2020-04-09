const hyphenise = (value: string): string => {
    return value
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
        .toLowerCase();
};

export class ValidationError {
    constructor (public readonly field: string, public readonly text: string) {
        if (!field) {
            throw new Error('Field name is required');
        }
        if (!text) {
            throw new Error('Error message is required');
        }
    }

    get href(): string {
        return `#${hyphenise(this.field)}-error`;
    }
}

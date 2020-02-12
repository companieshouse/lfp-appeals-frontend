export class ValidationError {
    constructor (public readonly field: string, public readonly text: string) {
        if (!field) {
            throw new Error('Field name is required')
        }
        if (!text) {
            throw new Error('Error message is required')
        }
    }

    get href(): string {
        return `#${this.field}-error`;
    }
}

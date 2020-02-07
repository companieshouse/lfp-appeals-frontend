export class ValidationError {
    
    constructor(public readonly field: string, public readonly text: string) { }

    get href(): string {
        return `#${this.field}-error`;
    }

}
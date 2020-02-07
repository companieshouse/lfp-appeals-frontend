import { ValidationError } from './ValidationError';

export class ValidationResult {

    constructor(public readonly errors: ValidationError[] = []) { }

    public getErrorForField(field: string): ValidationError | undefined {

        return this.errors.find(error => error.field === field);
    }

}
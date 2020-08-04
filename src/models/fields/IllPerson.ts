export enum IllPerson {
    director = 'director',
    accountant = 'accountant',
    family = 'family',
    employee = 'employee',
    someoneElse = 'someoneElse'
}

export function getIllPersonValues(): string[] {
    return Object.values(IllPerson).filter(x => typeof x === 'string');
}
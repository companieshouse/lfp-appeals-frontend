import { NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';

interface StatusCode {
    status: number;
}
// tslint:disable: max-classes-per-file

export class AppealServiceError extends Error implements StatusCode {
    public readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export class AppealNotFoundError extends Error implements StatusCode {
    public readonly status: number = NOT_FOUND;
}

export class AppealUnauthorisedError extends Error implements StatusCode{
    public readonly status: number = UNAUTHORIZED;
}

export class AppealUnprocessableEntityError extends Error implements StatusCode {
    public readonly status: number = UNPROCESSABLE_ENTITY;

}


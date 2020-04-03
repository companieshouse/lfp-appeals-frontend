import { NOT_FOUND } from 'http-status-codes';
import { AbstractFileError } from './AbstractFileError';

export class FileNotFoundError extends AbstractFileError {

    constructor(fileId: string, extra?: string){
        super(fileId, f => `File ${f} not found.`, NOT_FOUND, extra);
    }
}
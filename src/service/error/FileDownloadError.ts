import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { AbstractFileError } from './AbstractFileError';

export class FileDownloadError extends AbstractFileError {
    constructor(fileId: string, reason: string) {
        super(FileDownloadError.name,
            fileId, f => `An error occurred trying to download the file ${f}`,
            INTERNAL_SERVER_ERROR,
            reason);
    }
}
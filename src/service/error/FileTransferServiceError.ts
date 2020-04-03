import { AbstractFileError } from './AbstractFileError';

export class FileTransferServiceError extends AbstractFileError {
    constructor(fileId: string, status: number, reason: string) {
        super(fileId, f => `An error occurred trying to download the file ${f}`,
            status,
            reason);
    }
}
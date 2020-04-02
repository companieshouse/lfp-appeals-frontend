export abstract class AbstractFileError extends Error {
    constructor(className: string,
                fileId: string,
                messageProd: (fileId: string) => string,
                public readonly extraData?: string) {
        super(messageProd(fileId));
        super.name = className;
    }
}
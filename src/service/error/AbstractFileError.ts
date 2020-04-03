export abstract class AbstractFileError extends Error {
    constructor(fileId: string,
                messageProducer: (fileId: string) => string,
                public readonly statusCode: number,
                public readonly extraData?: string,) {
        super(messageProducer(fileId));
    }
}
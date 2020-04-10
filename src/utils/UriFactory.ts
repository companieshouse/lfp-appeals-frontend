import { Request } from 'express';

export interface UriFactory {
    createAbsoluteUri(path: string): string;
}

export const newUriFactory = (req: Request): UriFactory => {
    return {
        createAbsoluteUri(path: string): string {
            return new URL(path, `${req.protocol}://${req.headers.host}`).href;
        }
    };
};

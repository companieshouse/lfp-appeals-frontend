import { Readable, Writable } from "stream";

export const createReadable = (content: string): Readable => {
    const readable = new Readable();
    readable.push(content);
    readable.push(null);
    return readable;
};

export const convertReadableToString = async (readable: Readable): Promise<string> => {
    const chunks: any[] = [];

    const writable = new Writable();
    writable._write = (chunk: any,
        // @ts-ignore
        encoding: string,
        callback: (error?: Error | null | undefined) => void): void => {

        chunks.push(chunk);
        callback();
    };

    await new Promise((resolve, reject) => readable.pipe(writable).on("finish", resolve).on("error", reject));

    return Buffer.concat(chunks).toString();
};

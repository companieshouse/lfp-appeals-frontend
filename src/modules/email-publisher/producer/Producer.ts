export type Payload = { topic: string, message: Buffer };

export interface Producer {
    send(payload: Payload): Promise<void>;
}

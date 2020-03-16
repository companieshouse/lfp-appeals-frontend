import { Request } from 'express';

export type FormSubmissionProcessorConstructor = new (...args: any[]) => FormSubmissionProcessor

export interface FormSubmissionProcessor {
    process(req: Request): void | Promise<void>
}

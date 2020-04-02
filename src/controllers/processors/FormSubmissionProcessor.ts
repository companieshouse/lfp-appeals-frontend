import { Request } from 'express';

export type FormSubmissionProcessorConstructor = new (...args: any[]) => FormSubmissionProcessor

export interface FormSubmissionProcessor {
    process(request: Request): void | Promise<void>
}

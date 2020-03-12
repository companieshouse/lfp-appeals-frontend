import { Request } from 'express';

export interface FormSubmissionProcessor {
    process(req: Request): void | Promise<void>
}
